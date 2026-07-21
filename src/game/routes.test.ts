import { describe, expect, test } from 'vitest'
import { getLine, LINES } from '../data/lines'
import { dailyStations, getRoute } from './routes'

describe('route data', () => {
  test('contains the eight approved lines', () => {
    expect(LINES.map(line => line.id)).toEqual([
      'seoul-1', 'seoul-2', 'seoul-3', 'suin-bundang', 'incheon-1', 'incheon-2', 'arex', 'yamanote',
    ])
  })

  test('freezes official Seoul line 3 and Suin-Bundang station order', () => {
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

    expect(getLine('seoul-3')).toMatchObject({ name: '서울 3호선', color: '#EF7C1C', sequences: [seoul3] })
    expect(getLine('suin-bundang')).toMatchObject({ name: '수인·분당선', color: '#F5A200', sequences: [suinBundang] })
  })

  test('declares reachable service termini and official loop presets', () => {
    for (const line of LINES.filter(line => !line.loop)) {
      expect(line.serviceTermini?.length).toBeGreaterThan(1)
      expect(line.serviceTermini?.every(({ station }) => line.sequences.flat().includes(station))).toBe(true)
      expect(line.serviceTermini?.every(({ source }) => source.trim().length > 0)).toBe(true)
    }
    for (const id of ['seoul-3', 'suin-bundang']) {
      const stations = getLine(id).sequences.flat()
      expect(new Set(stations).size).toBe(stations.length)
    }
    expect(getLine('seoul-3').serviceTermini?.map(({ station }) => station)).toEqual([
      '대화', '구파발', '삼송', '오금',
    ])
    expect(getLine('seoul-3').serviceTermini).toEqual([
      { station: '대화', source: 'https://info.korail.com/info/selectBbsNttView.do?bbsNo=199&key=911&nttNo=23761' },
      { station: '구파발', source: 'https://data.seoul.go.kr/dataList/OA-101/A/1/datasetView.do' },
      { station: '삼송', source: 'https://info.korail.com/info/selectBbsNttView.do?bbsNo=199&key=911&nttNo=23761' },
      { station: '오금', source: 'https://data.seoul.go.kr/dataList/OA-22535/F/1/datasetView.do' },
    ])
    expect(getLine('suin-bundang').serviceTermini?.map(({ station }) => station)).toEqual([
      '청량리', '왕십리', '죽전', '고색', '오이도', '인천',
    ])
    expect(getLine('seoul-2').loopPreset).toMatchObject({
      origin: '신도림', directions: [{ value: 'clockwise' }, { value: 'counterclockwise' }],
    })
    expect(getLine('yamanote').loopPreset).toMatchObject({
      origin: '도쿄', directions: [{ value: 'outer' }, { value: 'inner' }],
    })
  })

  test('includes the current Line 1 northern extension and endpoint', () => {
    expect(getLine('seoul-1').sequences[0]?.slice(0, 4)).toEqual(['연천', '전곡', '청산', '소요산'])
    expect(getLine('seoul-1').serviceTermini?.map(({ station }) => station)).toEqual(['연천', '인천', '신창'])
    expect(getLine('seoul-1').serviceTermini?.every(({ source }) =>
      source === 'https://info.korail.com/info/selectBbsNttView.do?bbsNo=199&key=911&nttNo=23761',
    )).toBe(true)
  })

  test('wraps Seoul line 2 in the selected direction', () => {
    expect(getRoute('seoul-2', '신도림', '문래', 'clockwise').stationIds).toEqual(['신도림', '문래'])
    expect(getRoute('seoul-2', '문래', '신도림', 'counterclockwise').stationIds).toEqual(['문래', '신도림'])
  })

  test('keeps Yamanote inner and outer directions opposite', () => {
    expect(getRoute('yamanote', '신주쿠', '신오쿠보', 'inner').stationIds).not.toEqual(
      getRoute('yamanote', '신주쿠', '신오쿠보', 'outer').stationIds,
    )
  })

  test('supports both Seoul line 1 branches from Guro', () => {
    expect(getRoute('seoul-1', '구로', '인천').stationIds.at(-1)).toBe('인천')
    expect(getRoute('seoul-1', '구로', '신창').stationIds.at(-1)).toBe('신창')
  })

  test('daily stations are deterministic without adjacent duplicates', () => {
    const first = dailyStations('arex', '2026-07-21')
    expect(first).toEqual(dailyStations('arex', '2026-07-21'))
    expect(first.every((station, index) => index === 0 || station !== first[index - 1])).toBe(true)
  })

  test('rejects stations outside the selected line', () => {
    expect(() => getRoute('seoul-2', '신도림', '인천')).toThrow('Invalid station')
  })

  test('allows a zero-stop route without looping', () => {
    expect(getRoute('seoul-2', '신도림', '신도림').stationIds).toEqual(['신도림'])
  })
})
