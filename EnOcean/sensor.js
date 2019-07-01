// �e�Z���T�[���̑���l�v�Z���W���[���������ɒ�`����

// �o�^����Ă���Z���T�[�̌v�Z���W���[�����X�g
module.exports.module_list = {"u-rd":"calc_ac", "watty":"calc_temperature", "core_staff":"calc_temp_humidity"};

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

// �����x�v�Z�iCore Staff�j
module.exports.calc_temp_humidity = function (data){
    var result = [];
    if (data.length < 4*2) {
        // 4Byte�ȏ�łȂ���΋󃊃X�g�ԋp
        return ret;
    }
    // 4Byte�̃f�[�^���̂����擪2Byte�ڂ����x�A3Byte�ڂ����x
    var dec = parseInt(data, 16);
    //var bin = dec.toString(2);
    // ���x�̒��o(2Byte��)
    //var dec1 = parseInt(bin.substr(8,8),2);
    var dec1 = (dec >> 16) & 0xFF;
    // ���x�̒��o(3Byte��)
    //var dec2 = parseInt(bin.substr(16,8),2);
    var dec2 = (dec >> 8) & 0xFF;
    
    // ���x�A���x�̌v�Z�i0�`250�̐��l��0�`100%�A-20�`60���ɕϊ�����)
    var hid = dec1 * (100 / 250);
    var temp = dec2 * (80 / 250) - 20;
    // �덷���ۂ߂�
    hid = Math.round(hid * 10);
    hid = hid / 10;
    temp = Math.round(temp * 100);
    temp = temp / 100;
    
    result.push(hid);
    result.push(temp);
    
    return result;
};
