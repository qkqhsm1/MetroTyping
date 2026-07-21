import { initializeApp } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { normalizeNickname, validateRun } from './validators.js'

initializeApp()
const db=getFirestore()
const lines=new Set(['seoul-1','seoul-2','incheon-1','incheon-2','arex','yamanote'])

function requireUser(request) {
  if(!request.auth) throw new HttpsError('unauthenticated','로그인이 필요합니다.')
  return request.auth.uid
}

export const reserveNickname=onCall({region:'asia-northeast3',enforceAppCheck:true},async request=>{
  const uid=requireUser(request)
  let nickname
  try{nickname=normalizeNickname(request.data?.nickname)}catch(error){throw new HttpsError('invalid-argument',error.message)}
  const key=nickname.toLocaleLowerCase('ko-KR')
  await db.runTransaction(async transaction=>{
    const nameRef=db.collection('nicknames').doc(key)
    if((await transaction.get(nameRef)).exists) throw new HttpsError('already-exists','이미 사용 중인 닉네임입니다.')
    transaction.create(nameRef,{uid,nickname,createdAt:Timestamp.now()})
    transaction.set(db.collection('profiles').doc(uid),{nickname,createdAt:Timestamp.now()},{merge:true})
  })
  return {ok:true,nickname}
})

export const beginRankedRun=onCall({region:'asia-northeast3',enforceAppCheck:true},async request=>{
  const uid=requireUser(request)
  const {lineId,mode='route',courseHash='default'}=request.data??{}
  if(!lines.has(lineId)||!['route','daily'].includes(mode)) throw new HttpsError('invalid-argument','지원하지 않는 코스입니다.')
  const run=db.collection('runs').doc()
  await run.set({uid,lineId,mode,courseHash,status:'issued',createdAt:Timestamp.now()})
  return {runId:run.id}
})

export const submitRankedRun=onCall({region:'asia-northeast3',enforceAppCheck:true},async request=>{
  const uid=requireUser(request)
  const {runId,answers}=request.data??{}
  if(typeof runId!=='string') throw new HttpsError('invalid-argument','운행 식별자가 없습니다.')
  return db.runTransaction(async transaction=>{
    const runRef=db.collection('runs').doc(runId)
    const snapshot=await transaction.get(runRef)
    if(!snapshot.exists||snapshot.data().uid!==uid) throw new HttpsError('not-found','운행 기록을 찾을 수 없습니다.')
    const run=snapshot.data()
    const elapsedMs=Date.now()-run.createdAt.toMillis()
    try{validateRun({status:run.status,answers,elapsedMs})}catch(error){throw new HttpsError('failed-precondition',error.message)}
    transaction.update(runRef,{status:'accepted',answers,elapsedMs,finishedAt:Timestamp.now()})
    transaction.set(db.collection('rankings').doc(`${uid}_${run.lineId}_${run.mode}`),{uid,lineId:run.lineId,mode:run.mode,answers,elapsedMs,updatedAt:Timestamp.now()},{merge:true})
    return {accepted:true,elapsedMs}
  })
})
