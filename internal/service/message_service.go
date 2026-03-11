package service

import (
	"context"
	"fmt"
	"strings"
	"sync/atomic"
	"time"

	"rocket-leaf/internal/model"
	"rocket-leaf/internal/rocketmq"

	rocketmqClient "github.com/apache/rocketmq-client-go/v2"
	"github.com/apache/rocketmq-client-go/v2/primitive"
	"github.com/apache/rocketmq-client-go/v2/producer"
)

// MessageService 消息查询服务
type MessageService struct {
	nextID          int64
	settingsService *SettingsService
}

// NewMessageService 创建消息查询服务
func NewMessageService(settingsService *SettingsService) *MessageService {
	return &MessageService{
		nextID:          1,
		settingsService: settingsService,
	}
}

func (s *MessageService) getNextID() int {
	return int(atomic.AddInt64(&s.nextID, 1))
}

// QueryMessages 查询消息，startTime/endTime 为 Unix 毫秒时间戳，0 表示不限制
func (s *MessageService) QueryMessages(topic string, key string, maxResults int, startTime, endTime int64) ([]*model.MessageItem, error) {
	client, err := rocketmq.GetClientManager().GetDefaultClient()
	if err != nil {
		return nil, fmt.Errorf("获取客户端失败: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), s.settingsService.GetRequestTimeout())
	defer cancel()

	if maxResults <= 0 {
		maxResults = s.settingsService.GetFetchLimit()
	}
	if endTime <= 0 {
		endTime = time.Now().UnixMilli()
	}
	if startTime < 0 {
		startTime = 0
	}

	msgs, err := client.QueryMessage(ctx, topic, key, maxResults, startTime, endTime)
	if err != nil {
		return nil, fmt.Errorf("查询消息失败: %w", err)
	}

	result := make([]*model.MessageItem, 0, len(msgs))
	for _, msg := range msgs {
		// MessageExt 使用 Properties map 获取 Tags 和 Keys
		tags := ""
		keys := ""
		if msg.Properties != nil {
			if t, ok := msg.Properties["TAGS"]; ok {
				tags = t
			}
			if k, ok := msg.Properties["KEYS"]; ok {
				keys = k
			}
		}

		item := &model.MessageItem{
			ID:             s.getNextID(),
			Topic:          msg.Topic,
			MessageID:      msg.MsgId,
			Tags:           tags,
			Keys:           keys,
			QueueID:        msg.QueueId,
			QueueOffset:    msg.QueueOffset,
			StoreHost:      msg.StoreHost,
			BornHost:       msg.BornHost,
			StoreTime:      time.Unix(msg.StoreTimestamp/1000, 0).Format("2006-01-02 15:04:05"),
			StoreTimestamp: msg.StoreTimestamp,
			Body:           string(msg.Body),
			Properties:     msg.Properties,
			Status:         model.MsgNormal,
		}

		result = append(result, item)
	}

	return result, nil
}

// QueryMessageByID 按消息 ID 查询消息
func (s *MessageService) QueryMessageByID(topic string, msgID string) (*model.MessageItem, error) {
	client, err := rocketmq.GetClientManager().GetDefaultClient()
	if err != nil {
		return nil, fmt.Errorf("获取客户端失败: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), s.settingsService.GetRequestTimeout())
	defer cancel()

	msg, err := client.ViewMessage(ctx, topic, msgID)
	if err != nil {
		return nil, fmt.Errorf("查询消息失败: %w", err)
	}

	tags := ""
	keys := ""
	if msg.Properties != nil {
		if t, ok := msg.Properties["TAGS"]; ok {
			tags = t
		}
		if k, ok := msg.Properties["KEYS"]; ok {
			keys = k
		}
	}

	item := &model.MessageItem{
		ID:             s.getNextID(),
		Topic:          msg.Topic,
		MessageID:      msg.MsgId,
		Tags:           tags,
		Keys:           keys,
		QueueID:        msg.QueueId,
		QueueOffset:    msg.QueueOffset,
		StoreHost:      msg.StoreHost,
		BornHost:       msg.BornHost,
		StoreTime:      time.Unix(msg.StoreTimestamp/1000, 0).Format("2006-01-02 15:04:05"),
		StoreTimestamp: msg.StoreTimestamp,
		Body:           string(msg.Body),
		Properties:     msg.Properties,
		Status:         model.MsgNormal,
	}

	return item, nil
}

// GetMessageDetail 获取消息详情
func (s *MessageService) GetMessageDetail(topic string, msgID string) (*model.MessageItem, error) {
	return s.QueryMessageByID(topic, msgID)
}

// GetMessageTrack 获取消息轨迹
// 注意：rocketmq-admin-go 库当前版本暂不支持 MessageTrackDetail
func (s *MessageService) GetMessageTrack(topic string, msgID string) ([]map[string]interface{}, error) {
	// TODO: 待 rocketmq-admin-go 库支持后实现
	return []map[string]interface{}{}, nil
}

// ResendMessage 重投消息
func (s *MessageService) ResendMessage(consumerGroup string, clientID string, topic string, msgID string) (string, error) {
	client, err := rocketmq.GetClientManager().GetDefaultClient()
	if err != nil {
		return "", fmt.Errorf("获取客户端失败: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), s.settingsService.GetRequestTimeout())
	defer cancel()

	result, err := client.ConsumeMessageDirectly(ctx, consumerGroup, clientID, topic, msgID)
	if err != nil {
		return "", fmt.Errorf("重投消息失败: %w", err)
	}

	return fmt.Sprintf("消息重投结果: %v", result), nil
}

// SendMessage 发送消息到指定 Topic
func (s *MessageService) SendMessage(topic string, tags string, keys string, body string) (string, error) {
	topic = strings.TrimSpace(topic)
	if topic == "" {
		return "", fmt.Errorf("发送消息失败: Topic 不能为空")
	}
	if strings.TrimSpace(body) == "" {
		return "", fmt.Errorf("发送消息失败: 消息体不能为空")
	}

	// 获取默认连接的 NameServer 地址
	manager := rocketmq.GetClientManager()
	nameServer := manager.GetDefaultConnection()
	if nameServer == "" {
		return "", fmt.Errorf("发送消息失败: 未设置默认连接")
	}

	// 创建 Producer
	p, err := rocketmqClient.NewProducer(
		producer.WithNameServer([]string{nameServer}),
		producer.WithRetry(2),
		producer.WithSendMsgTimeout(s.settingsService.GetRequestTimeout()),
	)
	if err != nil {
		return "", fmt.Errorf("创建 Producer 失败: %w", err)
	}

	if err := p.Start(); err != nil {
		return "", fmt.Errorf("启动 Producer 失败: %w", err)
	}
	defer p.Shutdown()

	msg := &primitive.Message{
		Topic: topic,
		Body:  []byte(body),
	}
	if tags != "" {
		msg.WithTag(tags)
	}
	if keys != "" {
		msg.WithKeys([]string{keys})
	}

	result, err := p.SendSync(context.Background(), msg)
	if err != nil {
		return "", fmt.Errorf("发送消息失败: %w", err)
	}

	return fmt.Sprintf("发送成功, MsgID: %s", result.MsgID), nil
}
