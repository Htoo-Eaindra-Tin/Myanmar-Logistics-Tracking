'use client'
import dynamic from 'next/dynamic'
import {useEffect,useState} from 'react';
import {getDemoState} from '../../lib/demo'

const TrackingMap = dynamic(() => import('../../components/Map'), {
  ssr: false,
  loading: () => <div className="map"><div style={{display:'grid',placeItems:'center',height:'100%',color:'#5d6b82'}}>Loading map...</div></div>
})

export default function Admin(){
  const [state,setState]=useState<any>(null)
  useEffect(()=>{
    const load=()=>setState(getDemoState())
    load()
    window.addEventListener('logistics-demo-update',load)
    return()=>window.removeEventListener('logistics-demo-update',load)
  },[])
  if(!state)return <p>Loading...</p>
  const rows=state.shipments
  const stats={
    total:rows.length,
    active:rows.filter((a:any)=>a.status!=='DELIVERED').length,
    delayed:rows.filter((a:any)=>a.status==='DELAYED').length,
    delivered:rows.filter((a:any)=>a.status==='DELIVERED').length
  }
  const loc=rows.find((a:any)=>a.latitude)||{latitude:21.9588,longitude:96.0891}
  return <>
    <div className="top">
      <div className="page-header">
        <div>
          <p className="eyebrow">Operations overview</p>
          <h1 className="page-title">Admin Dashboard</h1>
        </div>
        <span className="badge">Live demo</span>
      </div>
    </div>
    <div className="grid grid4">
      <div className="card stat-card">
        <div className="label-row"><span className="muted">Total shipments</span><span className="trend up">+12%</span></div>
        <div className="stat">{stats.total}</div>
      </div>
      <div className="card stat-card">
        <div className="label-row"><span className="muted">Active</span><span className="trend neutral">8 in motion</span></div>
        <div className="stat">{stats.active}</div>
      </div>
      <div className="card stat-card">
        <div className="label-row"><span className="muted">Delayed</span><span className="trend alert">Watchlist</span></div>
        <div className="stat">{stats.delayed}</div>
      </div>
      <div className="card stat-card">
        <div className="label-row"><span className="muted">Delivered</span><span className="trend up">On time</span></div>
        <div className="stat">{stats.delivered}</div>
      </div>
    </div>
    <div className="grid grid2" style={{marginTop:16}}>
      <div className="card map-card">
        <div className="card-header"><h2>Live Map</h2><span className="badge warning">Updated</span></div>
        <TrackingMap lat={loc.latitude} lng={loc.longitude}/>
      </div>
      <div className="card">
        <div className="card-header"><h2>Demo flow</h2><span className="badge high">Flow</span></div>
        <ol className="flow-list">
          <li>Trader creates MYT-2026-001</li>
          <li>Driver updates Yangon -&gt; Mandalay -&gt; Lashio</li>
          <li>Admin closes Muse route</li>
          <li>Affected users receive a warning</li>
          <li>Driver queues a checkpoint update offline</li>
          <li>Reconnect and synchronize</li>
          <li>Deliver shipment</li>
        </ol>
      </div>
    </div>
  </>
}
