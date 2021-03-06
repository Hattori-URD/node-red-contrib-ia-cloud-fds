
"use strict";
const moment = require("moment");

module.exports = function(RED) {

    function smoothing(config) {

        RED.nodes.createNode(this, config);

        const node = this;
        // copy config properties
        const params = config.params;
        let objBuffer = [];

        // no rule found
        if (params.length === 0)
            node.status({fill:"yellow", shape:"ring", text:"runtime.norule"});
        else
            node.status({fill:"green", shape:"dot", text:"runtime.ready"});

        // input message listener
        this.on("input",function(msg, send) {
            // payload not exist,empty or no rule, do nothing
            if (params.length === 0 || msg.request !== "store" || !msg.dataObject) return;

            let prms = params.filter(para => {
                return para.objectKey === msg.dataObject.objectKey || para.objectKey === "";
            });
            if (!prms) return;

            // object buffer entry exist ?
            let buffObj = objBuffer.find(elm => 
                elm.objectKey === msg.dataObject.objectKey);

            // no object in the buffer
            if (!buffObj) {
                buffObj = {
                    objectKey: msg.dataObject.objectKey,
                    preTimestamp: moment(msg.dataObject.timestamp).unix(),
                    cDataArray: []
                }
                objBuffer.push(buffObj);
            }

            let contentData = msg.dataObject.objectContent.contentData;
            let range, initTime, value;
            for (let dItem of contentData) {
                
                value = Number(dItem.dataValue);
                // dataName or commonName dose match para's ?
                let param = prms.find(pr => { return (pr.dataName === ""
                    || dItem.dataName === pr.dataName
                    || dItem.commonName === pr.dataName)
                });
                if (!param) continue;

                range = parseInt(param.range);
                initTime = parseInt(param.initTime);

                let item = buffObj.cDataArray.find(elm => {
                    return elm.dataName === dItem.dataName
                });

                // dataName not exist yet, push new one
                if (!item) {
                    item = {
                        dataName: dItem.dataName,
                        dataValueBuff: new Array(range),
                        sum: 0,
                        pointer: 0,
                        dNum: 1
                    }
                    item.dataValueBuff.fill(0);
                    buffObj.cDataArray.push(item);
                }

                if (initTime !== 0 &&
                    moment(msg.dataObject.timestamp).unix() - buffObj.preTimestamp >= initTime) {
                    item.sum = 0;
                    item.dataValueBuff.fill(0);
                    item.pointer = 0;
                    item.dNum = 1;
                }

                // subtracts the oldest and adds the new one
                item.sum = item.sum - item.dataValueBuff[item.pointer] + value;

                // store newest data to th buffer
                item.dataValueBuff[item.pointer] = value;

                // culcurate moving ave. and set it to the dataValue
                dItem.dataValue = item.sum / item.dNum;
                // update pointers
                item.pointer++;
                item.dNum++;
                if (item.pointer >= range) item.pointer = 0;
                if (item.dNum >= range) item.dNum = range;
            }
            // store timestamp for initializing buffer interval
            buffObj.preTimestamp = moment(msg.dataObject.timestamp).unix();

            // output message to the port
            send(msg);
            node.status({fill:"green", shape:"dot", text:"runtime.output"});
        }); 
    }

    RED.nodes.registerType("smoothing",smoothing);
}

/*  各データの構造のメモ */
/*
let param = {
    objectKey: "",
    range: 123,
    initTime: 123
}
let params = [param,];

let msg = {
    payload: [dataItems,],
    request: "store",
    dataObject: {
        objectType: "",
        objectKey: "",
        objectDescription: "",
        objectContent: {
            contentType: "",
            contentData: [
                {
                    dataNamwe: "",
                    dataValue: 123,
                    unit: "xx"
                },
            ]
        }

    }
}
let objBuffer = [{
    objectKey: "",
    preTimestamp: 0,
    cDataArray: [{
        dataName: "",
        dataValueBuff: [dataValue,],
        sum: 0,
        pointer: 0,
        dNum: 1
    },],
},]
*/
