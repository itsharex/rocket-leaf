import * as SettingsService from '../../bindings/rocket-leaf/internal/service/settingsservice.js'
import type { AppSettings } from '../../bindings/rocket-leaf/internal/model/models.js'

export type { AppSettings }

export async function getSettings(): Promise<AppSettings | null> {
  try {
    return await SettingsService.GetSettings()
  } catch (e) {
    console.error('GetSettings', e)
    throw e
  }
}

export async function updateSettings(settings: AppSettings): Promise<AppSettings | null> {
  try {
    return await SettingsService.UpdateSettings(settings)
  } catch (e) {
    console.error('UpdateSettings', e)
    throw e
  }
}

export async function resetSettings(): Promise<AppSettings | null> {
  try {
    return await SettingsService.ResetSettings()
  } catch (e) {
    console.error('ResetSettings', e)
    throw e
  }
}
