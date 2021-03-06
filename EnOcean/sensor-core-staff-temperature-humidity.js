const SensorInterface = require('./sensors-interface');

module.exports = class CoreStaffTemperatureHumidity extends SensorInterface {
    /**
     * 温湿度計算.
     */
    static process(data) {
        const result = [];
        if (data.length < 4 * 2) {
            // 4Byte以上でなければ空リスト返却
            return result;
        }
        // 4Byteのデータ長のうち先頭2Byte目が湿度、3Byte目が温度
        const dec = parseInt(data, 16);
        // 湿度の抽出(2Byte目)
        const dec1 = (dec >> 16) & 0xFF;
        // 温度の抽出(3Byte目)
        const dec2 = (dec >> 8) & 0xFF;

        // 湿度、温度の計算（0～250の数値を0～100%、-20～60℃に変換する)
        let hid = dec1 * (100 / 250);
        let temp = dec2 * (80 / 250) - 20;
        // 誤差を丸める
        hid = Math.round(hid * 10);
        hid = hid / 10;
        temp = Math.round(temp * 100);
        temp = temp / 100;

        result.push(hid);
        result.push(temp);

        return result;
    }

    static nodeRedFunction(RED) {
        // collect-data-object config node function definition
        function Core_Staff_Sensor(config) {
            RED.nodes.createNode(this, config);
            this.sensorId = config.sensorId;
            // this.dataName0 = config.dataName0;
            // this.unit0 = config.unit0;
            // this.dataName1 = config.dataName1;
            // this.unit1 = config.unit1;

            var node = this;
            var confObj = config.configObject;
            this.dItems = {};
            if (confObj) {
                try {
                    this.dItems = JSON.parse(confObj);
                } catch (e) {
                    // nodeのエラーを通知してして終了
                    node.error("runtime:jsonerror", confObj);
                }
            } else {
                // nodeのエラーを通知してして終了
                node.error("runtime:jsonerror", confObj);
            }
            this.on("input", function (msg) {});
            this.on("close", function () {});
        }
        RED.nodes.registerType("Core_Staff_Sensor", Core_Staff_Sensor);
    }
};
