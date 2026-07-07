/// <reference lib="webworker" />
import Supercluster from 'supercluster'

interface LoadMessage {
  type: 'load'
  data: GeoJSON.FeatureCollection
}

interface GetClustersMessage {
  type: 'getClusters'
  bbox: [number, number, number, number]
  zoom: number
}

type WorkerMessage = LoadMessage | GetClustersMessage

const index = new Supercluster({
  radius: 40,
  maxZoom: 14,
})

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { type } = e.data

  if (type === 'load') {
    index.load(e.data.data.features as any)
    self.postMessage({ type: 'loaded', count: e.data.data.features.length })
  } else if (type === 'getClusters') {
    const { bbox, zoom } = e.data
    const clusters = index.getClusters(bbox, zoom)
    self.postMessage({ type: 'clusters', clusters })
  }
}
