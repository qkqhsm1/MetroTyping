export type ServiceTerminus = { station: string; source: string }
export type LoopDirection = { value: 'clockwise' | 'counterclockwise' | 'outer' | 'inner'; label: string }
export type LoopPreset = { origin: string; directions: readonly [LoopDirection, LoopDirection] }
export type Line = {
  id: string
  name: string
  color: string
  loop?: boolean
  sequences: string[][]
  serviceTermini?: ServiceTerminus[]
  loopPreset?: LoopPreset
}

const s1North = '연천 전곡 청산 소요산 동두천 보산 동두천중앙 지행 덕정 덕계 양주 녹양 가능 의정부 회룡 망월사 도봉산 도봉 방학 창동 녹천 월계 광운대 석계 신이문 외대앞 회기 청량리 제기동 신설동 동묘앞 동대문 종로5가 종로3가 종각 시청 서울역 남영 용산 노량진 대방 신길 영등포 신도림 구로'.split(' ')
const s1Incheon = '구로 구일 개봉 오류동 온수 역곡 소사 부천 중동 송내 부개 부평 백운 동암 간석 주안 도화 제물포 도원 동인천 인천'.split(' ')
const s1Sinchang = '구로 가산디지털단지 독산 금천구청 석수 관악 안양 명학 금정 군포 당정 의왕 성균관대 화서 수원 세류 병점 세마 오산대 오산 진위 송탄 서정리 평택 성환 직산 두정 천안 봉명 쌍용 아산 탕정 배방 온양온천 신창'.split(' ')

/*
 * Frozen 2026-07-21 from primary operator material:
 * - Seoul Metropolitan Subway Map (Seoul Metropolitan Government, 2025-09-29), bundled at
 *   /assets/seoul-metro-map-20250929.pdf: complete station order and official line colors.
 * - Korail, "광역열차 운영정보 > 운행현황" (2025-01-01 basis),
 *   https://info.korail.com/info/contents.do?key=863: Suin-Bundang local Incheon↔Wangsimni and
 *   express Incheon↔Oido / Jukjeon↔Gosaek endpoints.
 * - Korail, "철도노조 태업으로 수도권전철 등 일부 열차 운행 지연" (2024-11-18),
 *   https://info.korail.com/info/selectBbsNttView.do?bbsNo=199&key=911&nttNo=23761:
 *   Line 3 Daehwa↔Samsong and Suin-Bundang Cheongnyangni/Wangsimni↔Jukjeon↔Gosaek↔Oido↔Incheon.
 * - Seoul Open Data Plaza, Seoul Metropolitan Subway Map dataset,
 *   https://data.seoul.go.kr/dataList/OA-22535/F/1/datasetView.do: official map/sequence evidence
 *   for the physical Line 3 endpoint at Ogeum. Gupabal is omitted as a quick-route terminus because
 *   accessible current primary material did not verify that short-turn service.
 * Accessed 2026-07-21.
 */
const seoul3 = [
  '대화', '주엽', '정발산', '마두', '백석', '대곡', '화정', '원당', '원흥', '삼송', '지축',
  '구파발', '연신내', '불광', '녹번', '홍제', '무악재', '독립문', '경복궁', '안국',
  '종로3가', '을지로3가', '충무로', '동대입구', '약수', '금호', '옥수', '압구정', '신사',
  '잠원', '고속터미널', '교대', '남부터미널', '양재', '매봉', '도곡', '대치', '학여울',
  '대청', '일원', '수서', '가락시장', '경찰병원', '오금',
]
const suinBundang = [
  '청량리', '왕십리', '서울숲', '압구정로데오', '강남구청', '선정릉', '선릉', '한티', '도곡',
  '구룡', '개포동', '대모산입구', '수서', '복정', '가천대', '태평', '모란', '야탑', '이매',
  '서현', '수내', '정자', '미금', '오리', '죽전', '보정', '구성', '신갈', '기흥', '상갈',
  '청명', '영통', '망포', '매탄권선', '수원시청', '매교', '수원', '고색', '오목천', '어천',
  '야목', '사리', '한대앞', '중앙', '고잔', '초지', '안산', '신길온천', '정왕', '오이도',
  '달월', '월곶', '소래포구', '인천논현', '호구포', '남동인더스파크', '원인재', '연수',
  '송도', '인하대', '숭의', '신포', '인천',
]

const korailSource = 'https://info.korail.com/info/contents.do?key=863'
const korailNoticeSource = 'https://info.korail.com/info/selectBbsNttView.do?bbsNo=199&key=911&nttNo=23761'
const seoulMapSource = 'https://data.seoul.go.kr/dataList/OA-22535/F/1/datasetView.do'
const incheonSource = 'https://www.ictr.or.kr/main/railway/intro.jsp'
const arexSource = 'https://www.arex.or.kr/station/trainTime.do?menuNo=MN201503300000000012&stnCd=010&tab=3'

export const LINES:Line[] = [
  { id:'seoul-1', name:'서울 1호선', color:'#0052A4', sequences:[s1North,s1Incheon,s1Sinchang], serviceTermini:['연천','인천','신창'].map(station=>({station,source:korailNoticeSource})) },
  { id:'seoul-2', name:'서울 2호선', color:'#00A84D', loop:true, sequences:['신도림 문래 영등포구청 당산 합정 홍대입구 신촌 이대 아현 충정로 시청 을지로입구 을지로3가 을지로4가 동대문역사문화공원 신당 상왕십리 왕십리 한양대 뚝섬 성수 건대입구 구의 강변 잠실나루 잠실 잠실새내 종합운동장 삼성 선릉 역삼 강남 교대 서초 방배 사당 낙성대 서울대입구 봉천 신림 신대방 구로디지털단지 대림'.split(' ')], loopPreset:{origin:'신도림',directions:[{value:'clockwise',label:'시계 방향'},{value:'counterclockwise',label:'반시계 방향'}]} },
  { id:'seoul-3', name:'서울 3호선', color:'#EF7C1C', sequences:[seoul3], serviceTermini:[{station:'대화',source:korailNoticeSource},{station:'삼송',source:korailNoticeSource},{station:'오금',source:seoulMapSource}] },
  { id:'suin-bundang', name:'수인·분당선', color:'#F5A200', sequences:[suinBundang], serviceTermini:['청량리','왕십리','죽전','고색','오이도','인천'].map(station=>({station,source:korailSource})) },
  { id:'incheon-1', name:'인천 1호선', color:'#7CA8D5', sequences:['검단호수공원 신검단중앙 아라 계양 귤현 박촌 임학 계산 경인교대입구 작전 갈산 부평구청 부평시장 부평 동수 부평삼거리 간석오거리 인천시청 예술회관 인천터미널 문학경기장 선학 신연수 원인재 동춘 동막 캠퍼스타운 테크노파크 지식정보단지 인천대입구 센트럴파크 국제업무지구 송도달빛축제공원'.split(' ')], serviceTermini:['검단호수공원','송도달빛축제공원'].map(station=>({station,source:incheonSource})) },
  { id:'incheon-2', name:'인천 2호선', color:'#ED8B00', sequences:['검단오류 왕길 검단사거리 마전 완정 독정 검암 검바위 아시아드경기장 서구청 가정 가정중앙시장 석남 서부여성회관 인천가좌 가재울 주안국가산단 주안 시민공원 석바위시장 인천시청 석천사거리 모래내시장 만수 남동구청 인천대공원 운연'.split(' ')], serviceTermini:['검단오류','운연'].map(station=>({station,source:incheonSource})) },
  { id:'arex', name:'공항철도', color:'#0090D2', sequences:['서울역 공덕 홍대입구 디지털미디어시티 마곡나루 김포공항 계양 검암 청라국제도시 영종 운서 공항화물청사 인천공항1터미널 인천공항2터미널'.split(' ')], serviceTermini:['서울역','인천공항2터미널'].map(station=>({station,source:arexSource})) },
  { id:'yamanote', name:'JR 야마노테선', color:'#9ACD32', loop:true, sequences:['신주쿠 신오쿠보 다카다노바바 메지로 이케부쿠로 오쓰카 스가모 고마고메 다바타 니시닛포리 닛포리 우구이스다니 우에노 오카치마치 아키하바라 간다 도쿄 유라쿠초 신바시 하마마쓰초 다마치 다카나와게이트웨이 시나가와 오사키 고탄다 메구로 에비스 시부야 하라주쿠 요요기'.split(' ')], loopPreset:{origin:'도쿄',directions:[{value:'outer',label:'외선순환'},{value:'inner',label:'내선순환'}]} },
]

export const getLine = (id:string) => LINES.find(line => line.id === id) ?? (() => { throw new Error(`Unknown line: ${id}`) })()

export const YAMANOTE_LABELS:Record<string,{ kanji:string; kana:string }> = Object.fromEntries([
  ['신주쿠','新宿','しんじゅく'],['신오쿠보','新大久保','しんおおくぼ'],['다카다노바바','高田馬場','たかだのばば'],['메지로','目白','めじろ'],['이케부쿠로','池袋','いけぶくろ'],['오쓰카','大塚','おおつか'],['스가모','巣鴨','すがも'],['고마고메','駒込','こまごめ'],['다바타','田端','たばた'],['니시닛포리','西日暮里','にしにっぽり'],['닛포리','日暮里','にっぽり'],['우구이스다니','鶯谷','うぐいすだに'],['우에노','上野','うえの'],['오카치마치','御徒町','おかちまち'],['아키하바라','秋葉原','あきはばら'],['간다','神田','かんだ'],['도쿄','東京','とうきょう'],['유라쿠초','有楽町','ゆうらくちょう'],['신바시','新橋','しんばし'],['하마마쓰초','浜松町','はままつちょう'],['다마치','田町','たまち'],['다카나와게이트웨이','高輪ゲートウェイ','たかなわゲートウェイ'],['시나가와','品川','しながわ'],['오사키','大崎','おおさき'],['고탄다','五反田','ごたんだ'],['메구로','目黒','めぐろ'],['에비스','恵比寿','えびす'],['시부야','渋谷','しぶや'],['하라주쿠','原宿','はらじゅく'],['요요기','代々木','よよぎ'],
].map(([ko,kanji,kana])=>[ko,{kanji,kana}]))
