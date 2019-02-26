<template>
  <div id="home">
  <div class="offline" v-show="offline"><div class="text-center col-xs-10 col-md-6" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.9);padding:1%;border:1px solid white;color:white;box-shadow:0 0 15px black;">You are offline <i class="fa fa-frown-o" aria-hidden="true"></i><br/>Here are your latest Search Items
  <div v-for="(i,index) in list" class="text-left hover" @click="load=true;offlinestate=i;offlineindex=index;submit()">{{i}}</div>
  </div>
  </div>
  <i v-show="load" id="center" class="fa fa-2x fa-spin fa-circle-o-notch" aria-hidden="true"></i>
  <div id="header" class="text-center"><i class="fa fa-sun-o" aria-hidden="true"></i> Weather Forecast <i class="fa fa-cloud" aria-hidden="true"></i></div>
    <div class="container">
      <div class="row">
        <div class="col-md-3"></div>
        <div class="col-xs-12 col-md-6 box text-center">
        <form @submit.prevent="submit">
          <input type="text" v-model="query" class="form-control" placeholder="Name of the city"/><br/>
          <input class="btn btn-primary btn-block" type="submit" value="Get Updates"/>
        </form><br/>
        <p @click="location" class="text-center" style="color:white">Get the current status with respect to my city</p>
        </div>
        <div class="col-md-3"></div>
      </div>
    </div>
  </div>
</template>

<script>
const jsonp=require('jsonp')
const isOnline = require('is-online')

export default {
  data () {
    return {
      query:"",
      load:false,
      offline:false,
      list:[],
      offlinestate:"",
      offlineindex:"",
      xml:[]
    }
  },
  methods : {
    submit () {
      let that=this
      this.load=true
      this.$store.state.query=this.query
      fetch('https://api.openweathermap.org/data/2.5/forecast?q='+that.query+'&APPID=147e4d7acb5b8aef6bb824b4a3813c5c&mode=xml')
      .then(response => response.text())
      .then(str => {
      let strresponse = str
      let list=[]
      if(localStorage.getItem('results')!=null){
        list=localStorage.getItem('results')
        list=list.split(',')
      }
      if(list.length=10){
        list.shift()
      }
      let json={}
      json[that.query]=strresponse
      json=JSON.stringify(json)
      list.push(json)
      list=list.toString()
      localStorage.setItem('results',list)
      let parser=(new window.DOMParser()).parseFromString(strresponse, "text/xml")
      return parser
      })
      .then(data => {
        let forecast=data.getElementsByTagName('forecast')
        forecast=forecast[0].children
        let jsondata=[]
        let json={}
        for(let i=0;i<forecast.length;i++){
        let nodename=forecast[i].nodeName
          for(let j=0;j<forecast[i].attributes.length;j++){
            let temp=forecast[i].attributes[j]
            if(json[nodename]==undefined)
            json[nodename]=nodename+":"+temp.name+" "+temp.value
            else
            json[nodename]+=(" "+temp.name+" "+temp.value)
          }
          let temp=forecast[i].children
          for(let k=0;k<temp.length;k++){
          let nodename=temp[k].nodeName
            for(let l=0;l<temp[k].attributes.length;l++){
              let attribute=temp[k].attributes[l]
              if(json[nodename]==undefined)
              json[nodename]=nodename+":"+"("+attribute.name+" "+attribute.value+")"
              else
              json[nodename]+=("("+attribute.name+" "+attribute.value+")")
            }
          }
          jsondata.push(json)
          json={}
        }
        that.$store.state.json=jsondata
      }).then(()=>{that.load=false;that.$router.push('/results')})
      .catch((e)=>{
        console.log(e)
        if (that.offline==true){
        that.$store.state.query=that.offlinestate
        let result=new window.DOMParser().parseFromString((that.xml)[that.offlineindex], "text/xml")
        let forecast=result.getElementsByTagName('forecast')
        forecast=forecast[0].children
        let jsondata=[]
        let json={}
        for(let i=0;i<forecast.length;i++){
        let nodename=forecast[i].nodeName
          for(let j=0;j<forecast[i].attributes.length;j++){
            let temp=forecast[i].attributes[j]
            if(json[nodename]==undefined)
            json[nodename]=nodename+":"+temp.name+" "+temp.value
            else
            json[nodename]+=(" "+temp.name+" "+temp.value)
          }
          let temp=forecast[i].children
          for(let k=0;k<temp.length;k++){
          let nodename=temp[k].nodeName
            for(let l=0;l<temp[k].attributes.length;l++){
              let attribute=temp[k].attributes[l]
              if(json[nodename]==undefined)
              json[nodename]=nodename+":"+"("+attribute.name+" "+attribute.value+")"
              else
              json[nodename]+=("("+attribute.name+" "+attribute.value+")")
            }
          }
          jsondata.push(json)
          json={}
        }
        that.$store.state.json=jsondata
        that.$router.push('/results')
        }
        that.load=false
      })
    },
    location () {
      this.load=true
      let that=this
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(that.getdata)
      } else {
        alert("Geolocation is not supported by this browser.")
      }
    },
    getdata (position) {
      let json={}
      let that=this
      let latitude=position.coords.latitude
      let longitude=position.coords.longitude
      json["latitude"]="latitude:"+latitude
      json["longitude"]="longitude:"+longitude
      jsonp('https://api.darksky.net/forecast/6fb327c8a06646b9f822302009d0d283/'+latitude+","+longitude, null, function (err, data) {
        if (err) {
          console.error(err.message)
        } else {
          that.$store.state.query="("+latitude.toFixed(2)+","+longitude.toFixed(2)+")"
          for(let i in data["currently"]){
            json[i]=i+":"+data["currently"][i]
          }
          that.load=false
          that.$router.push('/results')
        }
      })
      that.$store.state.json=[json]
    }
  },
  mounted () {
  let that=this
  isOnline().then(online => {
    if(!online){
      that.offline=true
      let data=localStorage.getItem('results')
      data=data.split(',')
      for(let i in data){
        let json=JSON.parse(data[i])
        for(let j in json){
          that.list.push(j)
          that.xml.push(json[j])
        }
      }
    }
  })
  }
}
</script>

<style scoped>
  #header{background:rgba(0,0,0,0.3);color:white;font-size:30px;border-bottom:1px solid white;text-shadow:0 0 10px white;}
  #home{position:fixed;min-width:100%;height:100%;background:url('./background.jpg');background-size:100% 100%;}
  input[type=text]{width:50% !important;transform:translateX(50%);transition:transform 2s,width 2s;}
  input[type=text]:focus{border:1px solid orange;width:100% !important;transform:translateX(0)}
  .btn{border:1px solid black;width:50% !important;transform:translateX(50%)}
  .box{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%)}
  .fa-spin{z-index:10;color:white;}
  #center{position:fixed;top:45%;left:50%;transform:translate(-50%,-50%);color:white;z-index:60;}
  @media screen and (max-width:768px){
    #center{position:fixed;left:47%;transform:translate(-50%,-50%);}
  }
  .hover:hover{background:white;color:black;transition: background 1s;}
  .offline{font-size:20px;position:fixed;min-height:100%;width:100%;background:rgba(255,255,255,0.7);z-index:50;}
</style>
