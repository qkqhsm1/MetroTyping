import { Component, type ReactNode } from 'react'

// A render crash inside gameplay (e.g. a route the map cannot draw) must never blank the whole app.
// This catches it and shows a way back instead of a white screen. Reset with a changing `key` on reuse.
export default class ErrorBoundary extends Component<{onReset:()=>void;children:ReactNode},{failed:boolean}> {
  state={failed:false}
  static getDerivedStateFromError(){return {failed:true}}
  render(){
    if(!this.state.failed)return this.props.children
    return <section className="result"><p className="eyebrow">OUT OF SERVICE</p><h1>이 구간은 운행할 수 없어요</h1><p>다른 노선이나 방향으로 다시 시도해 주세요.</p><button className="primary" onClick={this.props.onReset}>다른 노선 운행</button></section>
  }
}
