import * as ClusterService from '../../bindings/rocket-leaf/internal/service/clusterservice.js'
import type { BrokerNode } from '../../bindings/rocket-leaf/internal/model/models.js'

export async function getBrokers(): Promise<(BrokerNode | null)[]> {
  try {
    return await ClusterService.GetBrokers()
  } catch (e) {
    console.error('GetBrokers', e)
    throw e
  }
}
