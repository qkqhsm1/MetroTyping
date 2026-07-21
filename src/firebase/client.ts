import { initializeApp } from 'firebase/app'
import { getAuth, signInAnonymously } from 'firebase/auth'
import { getFunctions, httpsCallable } from 'firebase/functions'

const config={apiKey:import.meta.env.VITE_FIREBASE_API_KEY,authDomain:import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,projectId:import.meta.env.VITE_FIREBASE_PROJECT_ID,appId:import.meta.env.VITE_FIREBASE_APP_ID}
export const firebaseAvailable=Object.values(config).every(Boolean)
const app=firebaseAvailable?initializeApp(config):null

export async function registerNickname(nickname:string) {
  if(!app) throw new Error('온라인 랭킹이 아직 연결되지 않았습니다.')
  await signInAnonymously(getAuth(app))
  const call=httpsCallable<{nickname:string},{ok:boolean;nickname:string}>(getFunctions(app,'asia-northeast3'),'reserveNickname')
  return (await call({nickname})).data
}
