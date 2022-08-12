import React from 'react';
import { PointCloudLayer, SimpleMeshLayer, LineLayer } from 'deck.gl';
import {
  Container, connectToHarmowareVis, HarmoVisLayers, FpsDisplay
} from 'harmoware-vis';
import Controller from '../components';
import VideoAnnotationLayer from '../layers/video-annotation-layer';

const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN; //Acquire Mapbox accesstoken

class App extends Container {
  constructor(props) {
    super(props);
    this.state = {
      currentTime: 0,
      videoUrl: undefined,
      elevatorDoorData: null,
      doordataArray: null,
      clickArea:[0,0,0,0]
    };
    this.videoRef = React.createRef()
    this.currentTime = 0
  }

  componentDidMount(){
    super.componentDidMount();
    const { actions } = this.props;
    actions.setInitialViewChange(false);
    actions.setSecPerHour(3600);
    actions.setLeading(0);
    actions.setTrailing(0);
    actions.setAnimatePause(true);
    if(this.videoRef.current && this.videoRef.current.player){
      this.videoRef.current.player.on("playing",()=>{
        this.props.actions.setTimeBegin(0)
        this.props.actions.setTimeLength(this.videoRef.current.player.duration)
      })
      this.videoRef.current.player.on("error",(error)=>{
        console.log({error})
      })
    }
  }

  componentDidUpdate(){
    if(Math.abs(this.currentTime - this.videoRef.current.player.currentTime) >= (1/120)){
      this.currentTime = this.videoRef.current.player.currentTime
      this.props.actions.setTime(this.currentTime)
    }
  }

  updateState(updateData){
    this.setState(updateData);
  }

  updateCanvas(context,width,height,elevatorDoorData){
    const clientHeight = 770
    const start_x = 100
    const graphwidth = width-start_x-50
    const graphheight = 100
    const framecount = elevatorDoorData!==null ? elevatorDoorData.length : 0
    const framePerPx = framecount>0 ? graphwidth/framecount:0
    this.setState({clickArea:[start_x,clientHeight,start_x+graphwidth,clientHeight+graphheight]})

    context.clearRect(0,0,width,height)
    context.strokeStyle = '#CCCCCC'
    context.fillStyle = '#CCCCCC'
    context.strokeRect(start_x,clientHeight,graphwidth,graphheight)
    context.textAlign="left";
    context.textBaseline="top";
    context.font = '12px sans-serif'
    context.fillText(`door open`,25,clientHeight)
    context.textBaseline="bottom";
    context.fillText(`door close`,25,clientHeight+graphheight)
    context.textBaseline="top";
    if(framecount > 0){
      context.beginPath()
      for(let j=0; j<elevatorDoorData.length; j=j+100){
        context.moveTo(start_x+(j*framePerPx),clientHeight-15)
        context.lineTo(start_x+(j*framePerPx),clientHeight)
        context.fillText(`${elevatorDoorData[j].elapsedtime}`,start_x+(j*framePerPx)+2,clientHeight-15)
      }
      context.font = '10px sans-serif'
      for(let j=0; j<elevatorDoorData.length; j=j+1){
        const date = new Date(elevatorDoorData[j].realtime * 1000)
        const minutes = date.getMinutes()
        const seconds = date.getSeconds()
        if(seconds === 0 && (minutes % 5) === 0){
          const timestr = elevatorDoorData[j].datestring.substring(8,16)
          context.moveTo(start_x+(j*framePerPx),clientHeight+graphheight)
          context.lineTo(start_x+(j*framePerPx),clientHeight+graphheight+15)
          context.fillText(`${timestr}`,start_x+(j*framePerPx)+2,clientHeight+graphheight+4)
        }
      }
      context.stroke()
      context.font = '12px sans-serif'
    }

    if(this.state.doordataArray !== null){
      context.strokeStyle = 'aqua'
      const doordataArray = this.state.doordataArray
      const dataLength = doordataArray.length
      context.beginPath()
      for(let i=0; i<dataLength; i=i+1){
        const value = (doordataArray[i]*(graphheight-6))-(graphheight-6)-3
        if(i===0){
          context.moveTo(start_x+(i*framePerPx),clientHeight-value)
        }else{
          context.lineTo(start_x+(i*framePerPx),clientHeight-value)
        }
      }
      context.stroke()
    }
    if(framecount > 0){
      const operation = elevatorDoorData.map((data,idx)=>{
        const wk_x = start_x+(idx*framePerPx)
        const condition = data.doordata===1 ? 'open' : 'close'
        const condiShift = data.doordata===1 ? -20 : 20
        return {...data,
          path:{coordinate:[[wk_x,clientHeight-20],[wk_x,clientHeight+graphheight]],strokeStyle:"lime"},
          text:[{fillText:{text:`${data.elapsedtime}`,x:wk_x+2,y:clientHeight-20},fillStyle:"lime"},
                {fillText:{text:`${condition}`,x:wk_x+2,y:clientHeight+(graphheight/2)+condiShift},fillStyle:"lime"}]
        }
      })
      const movesbase = [{operation}]
      this.props.actions.setMovesBase(movesbase)
    }
  }

  videoplay(){
    if(this.videoRef.current && this.videoRef.current.player){
      this.videoRef.current.player.play()
    }
  }
  videopause(){
    if(this.videoRef.current && this.videoRef.current.player){
      this.videoRef.current.player.pause()
    }
  }
  videorestart(){
    if(this.videoRef.current && this.videoRef.current.player){
      this.videoRef.current.player.restart()
      this.videoRef.current.player.play()
    }
  }
  canvasClick(viewX,viewY){
    const [x1=0,y1=0,x2=0,y2=0] = this.state.clickArea
    if(x1<viewX && viewX<x2 && y1<viewY && viewY<y2){
      const {duration=0} = this.videoRef.current ? this.videoRef.current.player :{}
      if(duration > 0 && x1 < x2){
        const unittime = duration / (x2 - x1)
        const setTime = unittime * (viewX - x1)
        this.props.actions.setTime(setTime);
        this.videoRef.current.player.currentTime = setTime
        console.log(`x:${viewX},y:${viewY}`)
      }
    }
  }

  render() {
    const { movedData } = this.props;
    const PathData = movedData
    const {elevatorUseRete,realtime,frame} = movedData.length>0 ? movedData[0] : {elevatorUseRete:0,realtime:0,frame:0}
    const {paused=false,currentTime=0,duration=0} = this.videoRef.current ? this.videoRef.current.player :{}
    const {clientWidth=0,clientHeight=0} = this.videoRef.current ? this.videoRef.current.videoRef.current :{}

    return (
      <div>

        <Controller {...this.props} {...this.state} updateState={this.updateState.bind(this)} realtime={realtime}
          paused={paused ? true : false} videoControl={this.videoRef.current&&this.videoRef.current.player}
          videoplay={this.videoplay.bind(this)} videopause={this.videopause.bind(this)} videorestart={this.videorestart.bind(this)}/>

          <CanvasComponent className="videoannotationlayer" videoUrl={this.state.videoUrl}
            width={clientWidth} height={900} updateCanvas={this.updateCanvas.bind(this)} elevatorDoorData={this.state.elevatorDoorData}/>

          <VideoAnnotationLayer ref={this.videoRef}
          videoUrl={this.state.videoUrl}
          AnnotationPropsArray={[{data:PathData}]}/>

          <MouseCaptureCanvas className="videoannotationlayer" canvasClick={this.canvasClick.bind(this)} width={clientWidth} height={900}/>

        <div className="harmovis_footer">
          videoWidth:{clientWidth}&nbsp;
          videoHeight:{clientHeight}&nbsp;
          elevatorUseRete:{(elevatorUseRete*100)|0}%&nbsp;
          realtime:{realtime|0}&nbsp;
          frame:{frame}&nbsp;
          videoDuration:{duration ? duration : 0}&nbsp;
          videoTime:{currentTime ? currentTime : 0}&nbsp;
        </div>
        <FpsDisplay />
      </div>
    );
  }
}
export default connectToHarmowareVis(App);

const CanvasComponent = (props)=>{
  const canvasRef = React.useRef(undefined);

  React.useEffect(()=>{
    if(canvasRef.current !== undefined){
      if(props.videoUrl){
        const context = canvasRef.current.getContext('2d');
        props.updateCanvas(context,props.width,props.height,props.elevatorDoorData);
      }
    }
  },[canvasRef,props.videoUrl,props.width,props.height,props.elevatorDoorData])

  const Result = React.useMemo(()=>
    <canvas ref={canvasRef} width={props.width} height={props.height} className={props.className}/>
  ,[props])

  return Result
}

const MouseCaptureCanvas = (props)=>{
  const canvasRef = React.useRef(undefined);

  React.useEffect(()=>{
    if(canvasRef.current !== undefined){
      canvasRef.current.onmousedown = function(e) {
        const rect = e.target.getBoundingClientRect();
        const viewX = e.clientX - rect.left
        const viewY = e.clientY - rect.top;
        props.canvasClick(viewX,viewY)
        canvasRef.current.onmousemove = function(e) {
          const rect = e.target.getBoundingClientRect();
          const viewX = e.clientX - rect.left
          const viewY = e.clientY - rect.top;
          props.canvasClick(viewX,viewY)
        }
      }
      canvasRef.current.onmouseup = function(e) {
        canvasRef.current.onmousemove = function(e) {}
      }
      canvasRef.current.onmouseover = function(e) {
        canvasRef.current.onmousemove = function(e) {}
      }
      canvasRef.current.onmouseout = function(e) {
        canvasRef.current.onmousemove = function(e) {}
      }
    }
  },[canvasRef])

  const Result = React.useMemo(()=>
    <canvas ref={canvasRef} width={props.width} height={props.height} className={props.className}/>
  ,[props])

  return Result
}
