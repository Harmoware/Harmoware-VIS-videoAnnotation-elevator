import React from 'react';
import { ElevatorDoorInput } from './elevator-door-input';
import { VideoInput } from './video-input';

const Controller = (props)=>{
  const [state,setState] = React.useState({ speed:1 })

  const { actions, inputFileName, elevatorDoorData, videoplay, videopause, videorestart, paused,
    updateState, videoControl, realtime } = props;
  const { elevatorDoorFileName } = inputFileName;
  const {currentTime=0,duration=0} = videoControl ? videoControl :{}
  const framecount = elevatorDoorData!==null ? elevatorDoorData.length-1 : 1

  const setTime = (e)=>{
    if(videoControl){
      actions.setTime(+e.target.value);
      videoControl.currentTime = +e.target.value
    }
  }
  const setSpeed = (e)=>{
    if(videoControl){
      const speed = +e.target.value
      setState({speed})
      videoControl.speed = speed
    }
  }

  const ControlButton = React.useMemo(()=>
    <>{paused ?
        <button onClick={videoplay} className="harmovis_button">play</button>:
        <button onClick={videopause} className="harmovis_button">pause</button>}
      <button onClick={videorestart} className="harmovis_button">restart</button>
    </>
  ,[paused])

  return (
    <div className="harmovis_controller">
        <ul className="flex_list">
        <li className="flex_column">
          <VideoInput updateState={updateState}/>
        </li>
        <li className="flex_row">
            <div className="harmovis_input_button_column" title='3D object data selection'>
            <label htmlFor="ElevatorDoorInput">
            ElevatorDoor Data Selection
            <ElevatorDoorInput actions={actions} id="ElevatorDoorInput" updateState={updateState}/>
            </label>
            <div>{elevatorDoorFileName}</div>
            </div>
        </li>
        <li className="flex_column">
          <label htmlFor="realtime">realtime (sec)</label>
            <input type="number" value={realtime|0} className='harmovis_input_number' disabled id="realtime"/>
        </li>
        <li className="flex_column">
          realtime&nbsp;:&nbsp;<SimulationDateTime realtime={realtime|0}/>
        </li>
        <li className="flex_column">
          <label htmlFor="ElapsedTimeRange">videoTime (sec)</label>
            <input type="number" value={currentTime|0} className='harmovis_input_number'
              min={0} max={duration} onChange={setTime} />
        </li>
        <li className="flex_column">
          <input type="range" value={currentTime} min={0} max={duration} step={(duration/framecount)} style={{'width':'100%'}}
            onChange={setTime} className='harmovis_input_range' />
        </li>

        <li className="flex_row">
          {ControlButton}
        </li>
        <li className="flex_column">
          <span>speed&nbsp;</span>
          <input type="range" value={state.speed} min={1} max={10} step={1} style={{'width':'100%'}}
            onChange={setSpeed} className='harmovis_input_range' />
        </li>
        </ul>
    </div>
  );
}
export default Controller

const SimulationDateTime = (props)=>{
  const { realtime, locales, options, className } = props;
  const  date = new Date(realtime * 1000);
  const dateString = date.toLocaleString(locales, options)

  const Result = React.useMemo(()=>
    <span className={className}>{dateString}</span>
  ,[dateString])

  return Result
}
SimulationDateTime.defaultProps = {
  locales: 'ja-JP',
  options: { year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    weekday: 'short' },
}
