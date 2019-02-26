<template>
  <div id="results">
  <div v-show="offline" id="offline"></div>
  <i v-show="load" id="center" class="fa fa-2x fa-spin fa-circle-o-notch" aria-hidden="true"></i>
  <div id="nav" class="col-xs-10 col-md-4" :class="{width:nav,show:!nav}">
    <div class="text-left" @click="nav=!nav"><i style="font-size:30px;" class="fa fa-close" aria-hidden="true"></i></div><hr/>
    <div class="space"><div>Get results for another city</div><input class="form-control" type="text" placeholder="Name of the City" v-model="nquery"/><br/><button style="border:1px solid black" class="col-xs-12 col-md-6 btn btn-danger" @click="request">Go</button></div><br/>
    <hr/>
    <div class="space" id="hover" @click="location">Get status with respect to my city</div><hr/>
  </div>
  <div id="header" class="container-fluid"><div class="row text-center"><div @click="nav=!nav" class="col-xs-1 text-left"><i class="fa fa-bars" aria-hidden="true" v-show="nav"></i></div><div class="col-xs-10">Statistics with respect to {{query.charAt(0).toUpperCase() + query.slice(1)}}</div></div></div>
    <div class="container text-left" style="margin-top:5%">
      <div class="row">
        <div v-show="length>1" v-for="i in data" class="col-xs-12 box">
          <div v-for="j in i" style="display:inline">
          <img class="col-xs-12 col-md-3" style="height:250px;margin:1%;border-radius:50%" v-if="(j.search('symbol')>=0)&&(j.search('clear')>=0)" src="https://mir-s3-cdn-cf.behance.net/project_modules/disp/421f0c16071075.562a500e6ddd4.gif"/>
          <img class="col-xs-12 col-md-3" style="height:250px;margin:1%;border-radius:50%" v-if="(j.search('symbol')>=0)&&(j.search('rain')>=0)" src="https://d13yacurqjgara.cloudfront.net/users/199340/screenshots/2146877/rainy-800x600.gif"/>
          <img class="col-xs-12 col-md-3" style="height:250px;margin:1%;border-radius:50%" v-if="(j.search('symbol')>=0)&&(j.search('clouds')>=0)" src="https://s-media-cache-ak0.pinimg.com/originals/f9/aa/a4/f9aaa4a9a402503edd577d665fb22d5b.gif"/>
          <div class="data col-xs-12 col-md-4" style="display:inline">{{j}}</div>
          </div>
        </div>
        <div v-show="length==1" v-for="i in data" class="col-xs-12 box">
          <img :src="src" class="col-xs-12 col-md-4" style="height:250px;border-radius:50%;margin:1%"/>
          <div v-for="j in i" class="data col-xs-12 col-md-3" style="display:inline">
            {{j}}
          </div>
        </div>
      </div>
    </div>
    <br/>
  </div>
</template>

<script>
var jsonp=require('jsonp')
const isOnline = require('is-online')

  export default {
    data () {
      return {
        nquery:"",
        data:this.$store.state.json,
        query:this.$store.state.query,
        length:"",
        src:"",
        nav:true,
        load:false,
        offline:false
      }
    },
    methods : {
      request(){
          let that=this
          this.load=true
          this.$store.state.query=this.nquery
          this.query=this.nquery
          fetch('https://api.openweathermap.org/data/2.5/forecast?q='+that.nquery+'&APPID=147e4d7acb5b8aef6bb824b4a3813c5c&mode=xml')
          .then(response => response.text())
          .then(str => {
          let strresponse = str
          let list=[]
          if(localStorage.getItem('results')!=null){
            list=localStorage.getItem('results')
            list=list.split(',')
          }
          let json={}
          json[that.query]=strresponse
          json=JSON.stringify(json)
          list.push(json)
          if(list.length=11){
            list.shift()
          }
          console.log(list)
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
            that.data=jsondata
            that.length=that.data.length
          }).then(()=>{that.query=that.nquery;that.load=false;})
          .catch((e)=>{
            console.log(e)
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
            that.query=that.$store.state.query
            for(let i in data["currently"]){
              json[i]=i+":"+data["currently"][i]
            }
            let src=""
            that.$store.state.json=[json]
            that.data=[json]
            switch(json["icon"]){
                case "icon:rain":
                  src="https://d13yacurqjgara.cloudfront.net/users/199340/screenshots/2146877/rainy-800x600.gif";break;
                case "icon:wind":
                  src="https://i1.wp.com/blogsizzle.com/wp-content/uploads/2016/02/Windy.gif";break;
                case "icon:snow":
                  src="https://media.giphy.com/media/Yy26NRbpB9lDi/giphy.gif";break;
                case "icon:cloudy":
                  src="https://mir-s3-cdn-cf.behance.net/project_modules/disp/d241d716071075.562a50091d914.gif";break;
                case "icon:fog":
                  src="https://media.tenor.co/images/c13ecb24e20d7f7e200f34902a4e4eb9/tenor.gif";break;
                case "icon:clear-day":
                  src="https://mir-s3-cdn-cf.behance.net/project_modules/disp/421f0c16071075.562a500e6ddd4.gif";break;
                case "icon:clear-night":
                  src="https://s-media-cache-ak0.pinimg.com/originals/1c/19/31/1c1931f09a88d4ff5ec524a247ebf9e1.gif";break;
                case "icon:partly-cloudy-day":
                  src="https://s-media-cache-ak0.pinimg.com/originals/f9/aa/a4/f9aaa4a9a402503edd577d665fb22d5b.gif";break;
                case "icon:partly-cloudy-night":
                  src="https://68.media.tumblr.com/0b4fd15ecf697f6844b75aec9b7e04a3/tumblr_oktr69xROa1u7gnm9o1_500.gif";break;
                case "icon:sleet":
                  src="https://media.giphy.com/media/l41Yq6xnFirZUUDv2/giphy.gif";break;
            }
            that.length=1
            that.load=false
            that.src=src
          }
        })
      }
    },
    mounted () {
    let that=this
    isOnline().then(online => {
      if(!online){
        that.offline=true
      }
    })
      this.length=this.data.length
      if(this.length==1){
      let src=""
      switch((this.data)[0]["icon"]){
          case "icon:rain":
            src="https://d13yacurqjgara.cloudfront.net/users/199340/screenshots/2146877/rainy-800x600.gif";break;
          case "icon:wind":
            src="https://i1.wp.com/blogsizzle.com/wp-content/uploads/2016/02/Windy.gif";break;
          case "icon:snow":
            src="https://media.giphy.com/media/Yy26NRbpB9lDi/giphy.gif";break;
          case "icon:cloudy":
            src="https://mir-s3-cdn-cf.behance.net/project_modules/disp/d241d716071075.562a50091d914.gif";break;
          case "icon:fog":
            src="https://media.tenor.co/images/c13ecb24e20d7f7e200f34902a4e4eb9/tenor.gif";break;
          case "icon:clear-day":
            src="https://mir-s3-cdn-cf.behance.net/project_modules/disp/421f0c16071075.562a500e6ddd4.gif";break;
          case "icon:clear-night":
            src="https://s-media-cache-ak0.pinimg.com/originals/1c/19/31/1c1931f09a88d4ff5ec524a247ebf9e1.gif";break;
          case "icon:partly-cloudy-day":
            src="https://s-media-cache-ak0.pinimg.com/originals/f9/aa/a4/f9aaa4a9a402503edd577d665fb22d5b.gif";break;
          case "icon:partly-cloudy-night":
            src="https://68.media.tumblr.com/0b4fd15ecf697f6844b75aec9b7e04a3/tumblr_oktr69xROa1u7gnm9o1_500.gif";break;
          case "icon:sleet":
            src="https://media.giphy.com/media/l41Yq6xnFirZUUDv2/giphy.gif";break;
      }
      this.src=src}
    }
  }
</script>

<style scoped>
  hr{height:2px;}
  #offline{position:fixed;min-height:100%;width:100%;background:silver;z-index:50;opacity:0.4;}
  #hover:hover{background:white;color:black;transition:background 0.5s;}
  .width{transform:translateX(-100%);transition:0.3s transform;}
  .show{transform:translateX(0);transition:0.3s transform;}
  .space{padding:1%;font-size:15px}
  #nav{position:fixed;background:#2c3849;color:white;min-height:100%;z-index:10;box-shadow:10px 0 15px rgba(0,0,0,0.8);}
  input[type=text]:focus{border:1px solid orange}
  .data{margin:1%;color:black;font-size:15px;background:rgba(255,255,255,0.6);box-shadow:0 0 8px rgba(0,0,0,0.6);border:1px solid rgba(0,0,0,0.5)}
  #header{background:rgba(0,0,0,0.3);color:white;border-bottom:1px solid white;font-size:30px;}
  #results{position:fixed;min-width:100%;height:100%;overflow:scroll;overflow-y: scroll; overflow-x:hidden;background:rgba(0,0,0,0.7);background-size:100% 100%;color:white;}
  .box{background:rgba(255,255,255,0.6);border:1px solid black;min-height:250px !important;}
  #results::-webkit-scrollbar {width: 4px;}
  ::-webkit-scrollbar-thumb {
      background: white;
      border:1px solid rgba(0,0,0,0.4);
      border-radius: 2px;
  }
  #center{position:fixed;top:45%;left:50%;transform:translate(-50%,-50%);color:black;z-index:20;}
  @media screen and (max-width:768px){
    #header{font-size:20px;}
    #center{position:fixed;left:46%;transform:translate(-50%,-50%);color:white;}
  }
</style>
