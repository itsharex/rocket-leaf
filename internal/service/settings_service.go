// Package service 提供业务服务层
package service

import (
	"encoding/json"
	"errors"
	"log"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"rocket-leaf/internal/model"
)

const settingsDataFileName = "settings.json"

// SettingsService 设置管理服务
type SettingsService struct {
	mu           sync.RWMutex
	settings     *model.AppSettings
	dataFilePath string
}

// NewSettingsService 创建设置管理服务
func NewSettingsService() *SettingsService {
	svc := &SettingsService{
		settings:     model.DefaultSettings(),
		dataFilePath: resolveSettingsDataFilePath(),
	}

	if err := svc.loadFromFile(); err != nil {
		log.Printf("[SettingsService] 加载设置失败: %v", err)
	}

	return svc
}

func resolveSettingsDataFilePath() string {
	configDir, err := os.UserConfigDir()
	if err != nil || strings.TrimSpace(configDir) == "" {
		return settingsDataFileName
	}

	return filepath.Join(configDir, appConfigDirName, settingsDataFileName)
}

// loadFromFile 从文件加载设置
func (s *SettingsService) loadFromFile() error {
	data, err := os.ReadFile(s.dataFilePath)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return nil
		}
		return err
	}

	// 先用默认值填充，再覆盖已保存的字段
	loaded := model.DefaultSettings()
	if err := json.Unmarshal(data, loaded); err != nil {
		return err
	}

	s.settings = loaded
	return nil
}

// saveToFileLocked 将设置持久化到文件（调用方需持有写锁）
func (s *SettingsService) saveToFileLocked() error {
	data, err := json.MarshalIndent(s.settings, "", "  ")
	if err != nil {
		return err
	}

	if err := os.MkdirAll(filepath.Dir(s.dataFilePath), 0o755); err != nil {
		return err
	}

	// 原子写入：先写临时文件，再重命名
	tempFilePath := s.dataFilePath + ".tmp"
	if err := os.WriteFile(tempFilePath, data, 0o600); err != nil {
		return err
	}

	if err := os.Rename(tempFilePath, s.dataFilePath); err != nil {
		_ = os.Remove(tempFilePath)
		return err
	}

	return nil
}

// GetSettings 获取全部设置
func (s *SettingsService) GetSettings() *model.AppSettings {
	s.mu.RLock()
	defer s.mu.RUnlock()

	// 返回副本
	copy := *s.settings
	return &copy
}

// UpdateSettings 更新全部设置并持久化
func (s *SettingsService) UpdateSettings(settings model.AppSettings) (*model.AppSettings, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	old := *s.settings
	s.settings = &settings

	if err := s.saveToFileLocked(); err != nil {
		s.settings = &old
		return nil, err
	}

	copy := *s.settings
	return &copy, nil
}

// ResetSettings 重置为默认设置
func (s *SettingsService) ResetSettings() (*model.AppSettings, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	old := *s.settings
	s.settings = model.DefaultSettings()

	if err := s.saveToFileLocked(); err != nil {
		s.settings = &old
		return nil, err
	}

	copy := *s.settings
	return &copy, nil
}
