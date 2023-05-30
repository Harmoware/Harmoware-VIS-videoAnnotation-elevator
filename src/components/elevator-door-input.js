import React from 'react';

export const ElevatorDoorInput = (props)=>{
    const { actions, id } = props;

    React.useEffect(()=>{
        const request = new XMLHttpRequest();
        request.open('GET', 'data/A7_video_07-00-05_03.csv');
        request.responseType = 'text';
        request.send();
        actions.setLoading(true);
        props.updateState({elevatorDoorData:null,doordataArray:null})
        actions.setMovesBase([]);
        request.onload = function() {
            try {
                const linedata = request.response.toString().split(/(\r\n|\n)/);
                const readdata = linedata.map((lineArray)=>{
                    return lineArray.split(',')
                })
                const titledata = readdata.shift()
                const dataLength = titledata.length
                const filterData = readdata.filter((data)=>data.length===dataLength)
                let doordataArray = []
                const firstdateTime = new Date(filterData[0][0]).getTime() /1000
                const elevatorDoorData = filterData.map((data,idx)=>{
                    const datestring = data[0]
                    const elapsedtime = new Date(datestring).getTime() /1000
                    let doordata = parseInt(data[1]) 
                    doordataArray.push(doordata)
                    return {
                        elapsedtime:elapsedtime-firstdateTime,
                        realtime:elapsedtime,
                        datestring: datestring,
                        doordata: doordata
                    }
                })
                const firstTime = elevatorDoorData[0].elapsedtime
                const ngData = elevatorDoorData.find((data,idx)=>data.elapsedtime!==(firstTime+idx))
                if(ngData!==undefined){
                    console.log({ngData})
                    window.alert('CSVデータのフレーム数が不正');
                    console.log('CSVデータのフレーム数が不正')
                    return
                }
                const lastData = {elapsedtime:elevatorDoorData[elevatorDoorData.length-1].elapsedtime+1}
                elevatorDoorData.push(lastData)
                console.log({elevatorDoorData})
                actions.setInputFilename({ elevatorDoorFileName: 'sample data' });
                props.updateState({elevatorDoorData,doordataArray})
                actions.setAnimatePause(true);
                actions.setLoading(false);
            } catch (exception) {
                actions.setLoading(false);
            }
        }
    },[])

    const onSelect = (e)=>{
        const reader = new FileReader();
        const file = e.target.files[0];
        if (!file) {
            return;
        }
        actions.setLoading(true);
        props.updateState({elevatorDoorData:null,doordataArray:null})
        actions.setMovesBase([]);
        reader.readAsText(file);
        const file_name = file.name;
        reader.onload = () => {
            const linedata = reader.result.toString().split(/(\r\n|\n)/);
            const readdata = linedata.map((lineArray)=>{
                return lineArray.split(',')
            })
            const titledata = readdata.shift()
            const dataLength = titledata.length
            const filterData = readdata.filter((data)=>data.length===dataLength)
            let doordataArray = []
            const firstdateTime = new Date(filterData[0][0]).getTime() /1000
            const elevatorDoorData = filterData.map((data,idx)=>{
                const datestring = data[0]
                const elapsedtime = new Date(datestring).getTime() /1000
                let doordata = parseInt(data[1]) 
                doordataArray.push(doordata)
                return {
                    elapsedtime:elapsedtime-firstdateTime,
                    realtime:elapsedtime,
                    datestring: datestring,
                    doordata: doordata
                }
            })
            const firstTime = elevatorDoorData[0].elapsedtime
            const ngData = elevatorDoorData.find((data,idx)=>data.elapsedtime!==(firstTime+idx))
            if(ngData!==undefined){
                console.log({ngData})
                window.alert('CSVデータのフレーム数が不正');
                console.log('CSVデータのフレーム数が不正')
                return
            }
            const lastData = {elapsedtime:elevatorDoorData[elevatorDoorData.length-1].elapsedtime+1}
            elevatorDoorData.push(lastData)
            console.log({elevatorDoorData})
            actions.setInputFilename({ elevatorDoorFileName: file_name });
            props.updateState({elevatorDoorData,doordataArray})
            //actions.setMovesBase(readdata);
            actions.setAnimatePause(true);
            //actions.setTimeBegin(0)
            //actions.setTime(0)
            actions.setLoading(false);
        };
    };

    const onClick = (e)=>{
        actions.setInputFilename({ elevatorDoorFileName: null });
        props.updateState({elevatorDoorData:null,doordataArray:null})
        actions.setMovesBase([]);
        e.target.value = '';
    };

    return (<>{React.useMemo(()=>
        <input type="file" accept=".csv"
        id={id} onChange={onSelect} onClick={onClick} />,[])}</>)
}
