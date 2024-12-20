"use strict";const{accessibility:{SIMULATION_TYPE:{ACHROMATOPSIA,DEUTERANOPIA,PROTANOPIA,TRITANOPIA,CONTRAST_LOSS,},},}=require("devtools/shared/constants");





const COLOR_TRANSFORMATION_MATRICES={NONE:[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0],[ACHROMATOPSIA]:[0.299,0.299,0.299,0,0.587,0.587,0.587,0,0.114,0.114,0.114,0,0,0,0,1,0,0,0,0,],[PROTANOPIA]:[0.152286,0.114503,-0.003882,0,1.052583,0.786281,-0.048116,0,-0.204868,0.099216,1.051998,0,0,0,0,1,0,0,0,0,],[DEUTERANOPIA]:[0.367322,0.280085,-0.01182,0,0.860646,0.672501,0.04294,0,-0.227968,0.047413,0.968881,0,0,0,0,1,0,0,0,0,],[TRITANOPIA]:[1.255528,-0.078411,0.004733,0,-0.076749,0.930809,0.691367,0,-0.178779,0.147602,0.3039,0,0,0,0,1,0,0,0,0,],[CONTRAST_LOSS]:[0.5,0,0,0,0,0.5,0,0,0,0,0.5,0,0,0,0,0.5,0.25,0.25,0.25,0,],};exports.simulation={COLOR_TRANSFORMATION_MATRICES,};