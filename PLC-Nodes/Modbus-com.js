/**
 * Copyright JS Foundation and other contributors, http://js.foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

"use strict";
const path = require("path");
const fs = require("fs");
const serialp = require("serialport");
const ModbusRTU = require('modbus-serial');
const PLCCom = require('./util/PLC-Com');

class ModbusCom extends PLCCom {
    constructor(config, MBObject){
        super(config, MBObject);
    }
    // PLCCom のreadItemFromPLC()をModbus仕様にオーバーライド
    async readItemsFromPLC(config, params) {

        let mbObj = this.comObj;
        let values = [];
        let resp;

        let TCPOptions = {port: Number(config.port)};
        let serialOptions = {baudRate: config.baud, parity: config.parity};

        if (config.comType == "TCP") {
            await mbObj.connectTCP(config.IPAdd, TCPOptions)
            .then(mbObj.setID(Number(config.unitID)));
        }
        else if (config.comType == "RTU") {
            await mbObj.connectRTU(config.serialPort, serialOptions);
        }
        else if (config.comType == "ASCII") {
            await mbObj.connectAsciiSerial(config.serialPort, serialOptions);
        }

        for (let param of params){
            switch(param.dev){
                case "Coil": // FC:1
                    resp = await mbObj.readCoils(param.addr, param.qty);
                    break;
                case "IS": // FC:2
                    resp = await mbObj.readDiscreteInputs(param.addr, param.qty);
                    break;
                case "HR": // FC:3
                    resp = await mbObj.readHoldingRegisters(param.addr, param.qty);
                    break;
                case "IR": // FC:4
                    resp = await mbObj.readInputRegisters(param.addr, param.qty);
                    break;
                default:
                    break;
            }
            values.push({dev: param.dev, addr: param.addr, qty: param.qty, value: resp.data});
        }
        await mbObj.close();
        return values;
    }
    // LinkObject形式へのデータ変換。Modbus仕様にオーバーライドする。
    toLinkObjectValue(value) {
        let type = typeof value;
        if (type == "boolean")
            return (value ? "1" : "0");
        else if (type == "number")
            return '0x' + (('0000' + value.toString(16).toUpperCase()).substr(-4));
    }

    // 通信リンクオブジェクトを登録するメソッド
    // Modbusの特有デバイス名でフィルタリングし、Baseクラスのメソッドコール
    addLinkData(lObj) {   
        //デバイス名が不正でないかチェック（error,Coil,IS,HR,IR）
        for(let dev of Object.keys(lObj)) {
            if (!(dev == "error") && !(dev == "Coil") && !(dev == "IS") && !(dev == "HR") && !(dev == "IR"))
                delete lObj[dev];
        }
        if (Object.keys(lObj).length)  super.addLinkData(lObj);
    }
    // 通信エラーのハンドラーメソッド
    comError(err) {
        this.linkObj.error = "Modbus com error!";
    }
}

module.exports = function(RED) {

    function modbusCom(config) {
        RED.nodes.createNode(this, config);

        const node = this;
        const mbObj = new ModbusRTU();
        const mbcom = new ModbusCom(config, mbObj);

        let cycleId;

        // 設定周期でのサイクリック通信を実施
        if (config.refreshCycle > 0) {
//            cycleId = setInterval(mbcom.CyclicRead, config.refreshCycle * 1000, RED);

            (function cycle(){
                mbcom.CyclicRead(RED)
                .then(() => {
                    setTimeout(cycle, config.refreshCycle * 1000)
                });
            }());


        }
        // クローズ時にサイクリック通信を停止
        // このNodeがクローズされる時っていつ？　誰からも呼ばれなくなったら停止する機能はない？
        // linkObjが空だったら止めるはあり？
        node.on("close",function(done) {
            clearInterval(cycleId);
            mbObj.close().then(done());
        });

        // linkObjにlinkDtataを追加するイベントリスナーを登録
        node.on("addLinkData", function(lObj) {
            if (Object.keys(lObj).length)  mbcom.addLinkData(lObj);
        });
    }

    RED.nodes.registerType("Modbus-com",modbusCom);

    RED.httpAdmin.get("/serialports", RED.auth.needsPermission('serial.read'), function(req,res) {
        serialp.list().then(
            ports => {
                const a = ports.map(p => p.comName);
                res.json(a);
            },
            err => {
                res.json([RED._("serial.errors.list")]);
            }
        )
    });

    RED.httpAdmin.get("/PLCComhtml", RED.auth.needsPermission('Modbus-com.read'), function(req,res) {
        let jscript;
        let fname = path.join(__dirname, 'util/PLC-Com.script.js')
        try{
            jscript = fs.readFileSync(fname);
          } catch(e) {
            //エラーの場合。
            jscript = null;
          }
        res.send(jscript);
    });

}
