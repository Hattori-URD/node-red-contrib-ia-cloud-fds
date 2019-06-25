// �e�Z���T�[���̑���l�v�Z���W���[���������ɒ�`����

// ���x�v�Z�iWatty�j
module.exports.calc_temperature = function (data){
    var ret = [];
    if (data.length < 5*2) {
        // 5Byte�ȏ�łȂ���΋󃊃X�g�ԋp
        return ret;
    }
    // javascript�ł�32bit�ȏ�̐��l���r�b�g�V�t�g�ł��Ȃ�����
    // ���l��10bit���ɕ������Ă���v�Z����
    var dec = parseInt(data, 16);
    var bin = dec.toString(2);
    var dec1 = parseInt(bin.substr(0,10),2);
    var dec2 = parseInt(bin.substr(10,10),2);
    var dec3 = parseInt(bin.substr(20,10),2);
    var dec4 = parseInt(bin.substr(30,10),2);
    var decList = [];
    decList.push(dec1);
    decList.push(dec2);
    decList.push(dec3);
    decList.push(dec4);
    
    var tempList = [];
    for (var ch_val of decList) {
        var temp = 130.0 - (parseFloat(ch_val) / 1024.0 * 170.0);
        tempList.push(temp);
    }
    return tempList;
};

// �d���v�Z�iUR-D�j
module.exports.calc_ac = function (data){
    var ret = [];
    if (data.length < 4*2) {
        // 4Byte�ȏ�łȂ���΋󃊃X�g�ԋp
        return ret;
    }
    var dec = parseInt(data, 16);
    var acList = [];
    var ch_val = (dec >> 8) & 0b1111111111;
    var ad_val = parseInt(ch_val,2);
    var K = 0;
    if (ad_val < 9) {
        K = (-0.0448 * ad_val) + 1.77;
    } else if (ad_val >= 9 && ad_val < 20) {
        K = (-0.0114 * ad_val) + 1.46;
    } else if (ad_val >= 20 && ad_val < 227) {
        K = (-0.000433 * ad_val) + 1.25;
    } else if (ad_val >= 227 && ad_val < 822) {
        K = (0.0000218 * ad_val) + 1.15;
    } else {
        K = (0.000365 * ad_val) + 0.86;
    }

    var E = 1.76;
    // CT�a��10mm �Ȃ̂�c, d �͈ȉ��̐��l
    var c = 56;
    var d = 3000;

    var I = (ad_val * K * E * d)/(2.8 * c);
    var ac = I / 1000;
    acList.push(ac);

    return acList;
};
