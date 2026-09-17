'use client'
import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {loginDemo, DEMO_USERS} from '../../lib/demo'

export default function Login(){
  const [email,setEmail]=useState('trader@example.com')
  const [password,setPassword]=useState('trader123')
  const [error,setError]=useState('')
  const router=useRouter()
  function submit(e:React.FormEvent){
    e.preventDefault(); setError('')
    const user=loginDemo(email,password)
    if(!user){setError('Invalid demo email or password.');return}
    if(user.role==='ADMIN') router.push('/admin')
    else if(user.role==='TRADER') router.push('/trader')
    else router.push('/login')
  }
  return <main className="login"><div className="login-panel"><div className="login-hero"><div className="brand-mark logo-lg">ML</div><p className="eyebrow">Myanmar Logistics Suite</p><h1>Move cargo with confidence.</h1><p className="hero-copy">Track vehicles, manage routes, and alert stakeholders before delays disrupt delivery schedules.</p><ul className="feature-list"><li>Real-time shipment visibility</li><li>Route risk monitoring</li><li>Trader coordination</li></ul></div><form className="card login-card" onSubmit={submit}><div className="card-header compact"><div><p className="eyebrow">Welcome back</p><h2>Sign in</h2></div><span className="badge">Demo</span></div>{error&&<div className="notice">{error}</div>}<label>Email<input className="input" value={email} onChange={e=>setEmail(e.target.value)} required type="email"/></label><label>Password<input className="input" value={password} onChange={e=>setPassword(e.target.value)} required type="password"/></label><button className="btn" style={{width:'100%'}}>Sign in</button><div className="demo-box"><b>Temporary users</b>{DEMO_USERS.map(u=><div key={u.id} className="demo-row"><div>{u.role}: {u.email}</div><div className="muted">Password: {u.password}</div></div>)}</div></form></div></main>
}
