export function normalizeNickname(value) {
  const nickname=String(value??'').normalize('NFC').trim().replace(/\s+/g,' ')
  if(nickname.length<2||nickname.length>12) throw new Error('닉네임은 2~12자여야 합니다.')
  if(!/^[가-힣A-Za-z0-9 ]+$/.test(nickname)) throw new Error('닉네임은 한글, 영문, 숫자만 사용할 수 있습니다.')
  return nickname
}

export function validateRun({ status,answers,elapsedMs }) {
  if(status!=='issued') throw new Error('이미 제출된 운행입니다.')
  if(!Number.isInteger(answers)||answers<1||!Number.isFinite(elapsedMs)||elapsedMs<answers*80) throw new Error('비정상적인 운행 기록입니다.')
  return { answers,elapsedMs:Math.round(elapsedMs) }
}
