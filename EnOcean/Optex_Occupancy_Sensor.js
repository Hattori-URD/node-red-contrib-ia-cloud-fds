module.exports = function(RED) {
    "use strict";
    var settings = RED.settings;

    // collect-data-object config node function definition
    function Optex_Occupancy_Sensor(config) {
        RED.nodes.createNode(this,config);
        this.sensor_id = config.sensor_id;

        var node = this;
        var confObj = config.configObject;
        this.dItems = {};
        if (confObj) {
          try { this.dItems = JSON.parse(confObj); }
          catch(e) {
            // node�̃G���[��ʒm���Ă��ďI��
            node.error("runtime:jsonerror", confObj);
          }
        } else {
            // node�̃G���[��ʒm���Ă��ďI��
            node.error("runtime:jsonerror", confObj);
        }
        this.on("input",function(msg) {});
        this.on("close",function() {});
    }
    RED.nodes.registerType("Optex_Occupancy_Sensor",Optex_Occupancy_Sensor);
}