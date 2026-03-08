import * as MessageService from '../../bindings/rocket-leaf/internal/service/messageservice.js'
import type { MessageItem } from '../../bindings/rocket-leaf/internal/model/models.js'

export async function queryMessages(
  topic: string,
  key: string,
  maxResults: number
): Promise<(MessageItem | null)[]> {
  try {
    return await MessageService.QueryMessages(topic, key, maxResults)
  } catch (e) {
    console.error('QueryMessages', e)
    throw e
  }
}

export async function queryMessageByID(topic: string, msgID: string): Promise<MessageItem | null> {
  try {
    return await MessageService.QueryMessageByID(topic, msgID)
  } catch (e) {
    console.error('QueryMessageByID', e)
    throw e
  }
}

export async function getMessageDetail(topic: string, msgID: string): Promise<MessageItem | null> {
  try {
    return await MessageService.GetMessageDetail(topic, msgID)
  } catch (e) {
    console.error('GetMessageDetail', e)
    throw e
  }
}

export async function resendMessage(
  consumerGroup: string,
  clientID: string,
  topic: string,
  msgID: string
): Promise<string> {
  try {
    return await MessageService.ResendMessage(consumerGroup, clientID, topic, msgID)
  } catch (e) {
    console.error('ResendMessage', e)
    throw e
  }
}
