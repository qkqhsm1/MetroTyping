export type Line2Station={korean:string;english:string;number:string}

const names=[
  ['신도림','Sindorim','234'],['문래','Mullae','235'],['영등포구청','Yeongdeungpo-gu Office','236'],['당산','Dangsan','237'],
  ['합정','Hapjeong','238'],['홍대입구','Hongik Univ.','239'],['신촌','Sinchon','240'],['이대','Ewha Womans Univ.','241'],
  ['아현','Ahyeon','242'],['충정로','Chungjeongno','243'],['시청','City Hall','201'],['을지로입구','Euljiro 1(il)-ga','202'],
  ['을지로3가','Euljiro 3(sam)-ga','203'],['을지로4가','Euljiro 4(sa)-ga','204'],['동대문역사문화공원','Dongdaemun History & Culture Park','205'],
  ['신당','Sindang','206'],['상왕십리','Sangwangsimni','207'],['왕십리','Wangsimni','208'],['한양대','Hanyang Univ.','209'],
  ['뚝섬','Ttukseom','210'],['성수','Seongsu','211'],['건대입구','Konkuk Univ.','212'],['구의','Guui','213'],['강변','Gangbyeon','214'],
  ['잠실나루','Jamsillaru','215'],['잠실','Jamsil','216'],['잠실새내','Jamsilsaenae','217'],['종합운동장','Sports Complex','218'],
  ['삼성','Samseong','219'],['선릉','Seolleung','220'],['역삼','Yeoksam','221'],['강남','Gangnam','222'],
  ['교대',"Seoul Nat'l Univ. of Education",'223'],['서초','Seocho','224'],['방배','Bangbae','225'],['사당','Sadang','226'],
  ['낙성대','Nakseongdae','227'],['서울대입구',"Seoul Nat'l Univ.",'228'],['봉천','Bongcheon','229'],['신림','Sillim','230'],
  ['신대방','Sindaebang','231'],['구로디지털단지','Guro Digital Complex','232'],['대림','Daerim','233'],
] as const

export const LINE_2_STATIONS:Line2Station[]=names.map(([korean,english,number])=>({korean,english,number}))
export const LINE_2_BY_NAME=new Map(LINE_2_STATIONS.map(station=>[station.korean,station]))
