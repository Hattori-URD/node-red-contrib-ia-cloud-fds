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

// RED.nodes.registerType()の第2引数を定義
// 必要に応じてRED.nodes.registerType()に渡す前に、オーバーライドする。
// 通信種別選択部分は、書き換えのための設定オブジェクトを定義してある。
var PLCComNodeConfig = {

    category: 'config',
    defaults: {
        name: {value:""},
        refreshCycle: {value:60, required:true},
        maxDataNum: {value:64, required:true},
        noBlank: {value:false, required:true},
        comType: {value:""},
        TCPPort:{value:502 },
        IPAdd:{value:"" },
        unitID:{value:255 },
        serialPort:{value:"" },
        serialAdd:{value:1 },
        baud:{value:115200 },
        parity:{value:"even" },
        configJson:{value:"", required:true},

        // 通信の種別を定義するオブジェクト
        // 利用する個別の通信Nodeの.htmlファイルのjavscriptでオーバライド?する。
        /*  [example]
        comTypeDef: [
                {v:"TCP",l:"editor.ModbusTCP", com:"TCP"},
                {v:"RTU",l:"editor.ModbusRTU", com:"serial"},
                {v:"ASCII",l:"editor.ModbusASCII", com:"serial"}
            ];
        }; */
        comTypeDef: {value:[{},]},

        requiredSet: {value: "", required:true},
    },


    label: function () {
        return this.name||this._("Modbus-com");
    },

    oneditprepare: function() {

        let node = this;
        
        // 通信種別を設定するSelectタグのoptionを設定する。
        let selectOptions = node.comTypeDef;

        for (var i=0; i < selectOptions.length; i++) {
            $("#node-config-input-comType").append($("<option></option>")
                .val(selectOptions[i].v).text(node._(selectOptions[i].l)));
        }

        // 通信種別ボタンが変化したら、設定画面を切り替える関数を定義
        // $("#node-config-input-comType").off('change');
        $("#node-config-input-comType").on('change', function(){
            let value = $("#node-config-input-comType").val();

            let cport = selectOptions.find((obj) => obj.v == value).com; 

            if (cport == "TCP") {
                $("#etherConf").show();
                $("#serialConf").hide();
            } else if (cport == "serial") {
                $("#etherConf").hide();
                $("#serialConf").show();
            }
        });

        $("#node-config-input-comType").change();

        // シリアルポートルックアップが押されたら
        $("#node-config-lookup-serial").click(function() {
            $("#node-config-lookup-serial").addClass('disabled');
            $.getJSON('serialPorts',function(data) {
                $("#node-config-lookup-serial").removeClass('disabled');
                var ports = data || [];
                $("#node-config-input-serialPort").autocomplete({
                    source:ports,
                    minLength:0,
                    close: function( event, ui ) {
                        $("#node-config-input-serialPort").autocomplete( "destroy" );
                    }
                }).autocomplete("search","");
            });
        });
    },

    oneditsave: function() {
        var comType = $("#node-config-input-comType").val();
        var requiredSet = "ready";
        
        $("#modbus-com-block").find("input[type='text']").each(function(idx, obj){
            switch($(obj).attr("id")) {
            case "node-config-input-TCPPort":
            case "node-config-input-IPAdd":
            case "node-config-input-unitID":
                if (!$(obj).val() && (comType == "TCP")) requiredSet = "";
                break;
            case "node-config-input-serialPort":
            case "node-config-input-serialAdd":
            case "node-config-input-baud":
                if (!$(obj).val() && ((comType == "RTU") || (comType == "ASCII"))) requiredSet = "";
                break;
            default:
                break;
            }
        });
        $("#node-config-input-requiredSet").val(requiredSet);

    },
};

