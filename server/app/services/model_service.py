import os
import json
from typing import List, Dict, Any, Optional
from app.schemas.model_schema import FemurModelBase, AnatomicalLandmark, MorphometricEdge

# Raw anatomical 3D landmarks provided for models 01 through 10
RAW_LANDMARKS_10_MODELS: List[Dict[str, Any]] = [
  {
    "model_id": "01",
    "Source": "37_Femur_R",
    "landmarks": {
      "HIP CENTRE": {"X": -63.25888968, "Y": -122.2023954, "Z": 883.8600302},
      "FEMUR KNEE CENTRE": {"X": -54.3999054, "Y": -99.18671773, "Z": 541.6777043},
      "MEDIAL EPICONDYLE": {"X": -24.17596786, "Y": -114.219349, "Z": 556.7965143},
      "LATERAL EPICONDYLE": {"X": -82.37900012, "Y": -82.37172071, "Z": 558.1225356},
      "MEDIAL DISTAL CONDYLE": {"X": -33.17478174, "Y": -100.0926051, "Z": 534.9278502},
      "LATERAL DISTAL CONDYLE": {"X": -68.05764513, "Y": -88.99059094, "Z": 537.3041679},
      "MEDIAL POSTERIOR CONDYLE": {"X": -28.68962849, "Y": -82.40646143, "Z": 553.3230514},
      "LATERAL POSTERIOR CONDYLE": {"X": -63.62525259, "Y": -68.69922333, "Z": 553.5816782},
      "Medial Anterior Cortex": {"X": -53.75378102, "Y": -127.7013937, "Z": 552.1774596},
      "Lateral Anterior Cortex": {"X": -82.8136491, "Y": -116.0782922, "Z": 549.0693899},
      "Medial Posterior Proximal": {"X": -32.4520507, "Y": -93.25046713, "Z": 570.1440513},
      "Lateral Posterior Proximal": {"X": -64.51968035, "Y": -77.76699035, "Z": 568.7168973}
    },
    "MA Length": 343.0698867,
    "TEA Length": 66.35979752,
    "AP Length": 51.31599627
  },
  {
    "model_id": "02",
    "Source": "38_Femur_R",
    "landmarks": {
      "HIP CENTRE": {"X": -85.46062501, "Y": -740.0058057, "Z": 951.5450294},
      "FEMUR KNEE CENTRE": {"X": -73.49243624, "Y": -481.9397412, "Z": 566.7483016},
      "MEDIAL EPICONDYLE": {"X": -32.66091666, "Y": -509.7399863, "Z": 574.2825834},
      "LATERAL EPICONDYLE": {"X": -111.2912489, "Y": -473.3748868, "Z": 597.3465256},
      "MEDIAL DISTAL CONDYLE": {"X": -44.81801051, "Y": -478.4401906, "Z": 558.2392557},
      "LATERAL DISTAL CONDYLE": {"X": -91.94358168, "Y": -467.0563175, "Z": 568.518702},
      "MEDIAL POSTERIOR CONDYLE": {"X": -38.75871984, "Y": -470.1735618, "Z": 591.707801},
      "LATERAL POSTERIOR CONDYLE": {"X": -85.95556894, "Y": -454.3111875, "Z": 601.2693949},
      "Medial Anterior Cortex": {"X": -72.61954401, "Y": -522.3934953, "Z": 559.7715294},
      "Lateral Anterior Cortex": {"X": -111.878445, "Y": -506.6953539, "Z": 563.9863865},
      "Medial Posterior Proximal": {"X": -43.84162526, "Y": -494.2230366, "Z": 604.0629418},
      "Lateral Posterior Proximal": {"X": -87.16391065, "Y": -475.1437979, "Z": 612.8520401}
    },
    "MA Length": 463.4758385,
    "TEA Length": 89.64984685,
    "AP Length": 69.3261791
  },
  {
    "model_id": "03",
    "Source": "39_Femur_R",
    "landmarks": {
      "HIP CENTRE": {"X": -30.11092274, "Y": -393.43207, "Z": 159.9817865},
      "FEMUR KNEE CENTRE": {"X": -25.89408946, "Y": -246.8986739, "Z": 88.03083958},
      "MEDIAL EPICONDYLE": {"X": -11.50764271, "Y": -256.7087377, "Z": 85.43227007},
      "LATERAL EPICONDYLE": {"X": -39.21200199, "Y": -249.6756975, "Z": 98.87621236},
      "MEDIAL DISTAL CONDYLE": {"X": -15.7910342, "Y": -244.3318219, "Z": 86.05096237},
      "LATERAL DISTAL CONDYLE": {"X": -32.39510692, "Y": -242.6691445, "Z": 91.19303538},
      "MEDIAL POSTERIOR CONDYLE": {"X": -13.65612314, "Y": -247.7055038, "Z": 97.71962588},
      "LATERAL POSTERIOR CONDYLE": {"X": -30.2853097, "Y": -244.5498267, "Z": 103.4316291},
      "Medial Anterior Cortex": {"X": -25.58653741, "Y": -258.0133469, "Z": 78.77532579},
      "Lateral Anterior Cortex": {"X": -39.41889279, "Y": -253.9658566, "Z": 82.82693258},
      "Medial Posterior Proximal": {"X": -15.44701774, "Y": -257.2203683, "Z": 97.25282486},
      "Lateral Posterior Proximal": {"X": -30.71105295, "Y": -252.9470317, "Z": 103.2958243}
    },
    "MA Length": 163.2995916,
    "TEA Length": 31.58693974,
    "AP Length": 24.4261638
  },
  {
    "model_id": "04",
    "Source": "40_Femur_R",
    "landmarks": {
      "HIP CENTRE": {"X": -99.07859481, "Y": -1384.336814, "Z": -191.3982633},
      "FEMUR KNEE CENTRE": {"X": -85.20330048, "Y": -848.3972144, "Z": -155.3501914},
      "MEDIAL EPICONDYLE": {"X": -37.86536464, "Y": -872.0768972, "Z": -178.8948978},
      "LATERAL EPICONDYLE": {"X": -129.025274, "Y": -874.1537647, "Z": -129.0138727},
      "MEDIAL DISTAL CONDYLE": {"X": -51.95966567, "Y": -837.8253237, "Z": -156.7690282},
      "LATERAL DISTAL CONDYLE": {"X": -106.5945969, "Y": -841.5472073, "Z": -139.3806111},
      "MEDIAL POSTERIOR CONDYLE": {"X": -44.93483985, "Y": -866.6366212, "Z": -129.068285},
      "LATERAL POSTERIOR CONDYLE": {"X": -99.65240701, "Y": -867.0416929, "Z": -107.5994623},
      "Medial Anterior Cortex": {"X": -84.19131471, "Y": -864.8423497, "Z": -200.0110135},
      "Lateral Anterior Cortex": {"X": -129.7060386, "Y": -859.974367, "Z": -181.8064487},
      "Medial Posterior Proximal": {"X": -50.82769549, "Y": -892.9823418, "Z": -146.052599},
      "Lateral Posterior Proximal": {"X": -101.0532954, "Y": -890.7470763, "Z": -121.8017605}
    },
    "MA Length": 537.3297328,
    "TEA Length": 103.9353603,
    "AP Length": 80.37315906
  },
  {
    "model_id": "05",
    "Source": "41_Femur_R",
    "landmarks": {
      "HIP CENTRE": {"X": -60.97836962, "Y": -678.9520262, "Z": -528.0133106},
      "FEMUR KNEE CENTRE": {"X": -52.43875692, "Y": -404.3895936, "Z": -343.876489},
      "MEDIAL EPICONDYLE": {"X": -23.30441005, "Y": -409.7654988, "Z": -363.7126839},
      "LATERAL EPICONDYLE": {"X": -79.40918887, "Y": -426.222219, "Z": -337.7652435},
      "MEDIAL DISTAL CONDYLE": {"X": -31.97881141, "Y": -398.3181689, "Z": -341.379469},
      "LATERAL DISTAL CONDYLE": {"X": -65.60412713, "Y": -405.6528201, "Z": -333.2567806},
      "MEDIAL POSTERIOR CONDYLE": {"X": -27.65535056, "Y": -422.1988429, "Z": -335.4810152},
      "LATERAL POSTERIOR CONDYLE": {"X": -61.33152494, "Y": -429.0212879, "Z": -324.1628003},
      "Medial Anterior Cortex": {"X": -51.8159257, "Y": -399.4114859, "Z": -372.7412904},
      "Lateral Anterior Cortex": {"X": -79.8281685, "Y": -402.4188956, "Z": -361.5402599},
      "Medial Posterior Proximal": {"X": -31.28213525, "Y": -431.0145559, "Z": -352.6409384},
      "Lateral Posterior Proximal": {"X": -62.19370805, "Y": -437.2858052, "Z": -339.0274074}
    },
    "MA Length": 330.7020161,
    "TEA Length": 63.96748791,
    "AP Length": 49.46602455
  },
  {
    "model_id": "06",
    "Source": "42_Femur_R",
    "landmarks": {
      "HIP CENTRE": {"X": -69.38130215, "Y": -368.6285127, "Z": -906.5424385},
      "FEMUR KNEE CENTRE": {"X": -59.66491497, "Y": -202.8398243, "Z": -568.901579},
      "MEDIAL EPICONDYLE": {"X": -26.51580101, "Y": -196.8522251, "Z": -591.5058349},
      "LATERAL EPICONDYLE": {"X": -90.3519225, "Y": -227.8296293, "Z": -575.3003705},
      "MEDIAL DISTAL CONDYLE": {"X": -36.38555099, "Y": -198.2778101, "Z": -562.987063},
      "LATERAL DISTAL CONDYLE": {"X": -74.64449763, "Y": -210.1261258, "Z": -559.1559375},
      "MEDIAL POSTERIOR CONDYLE": {"X": -31.46630921, "Y": -225.1646337, "Z": -570.7606688},
      "LATERAL POSTERIOR CONDYLE": {"X": -69.78312292, "Y": -238.3261773, "Z": -563.4893877},
      "Medial Anterior Cortex": {"X": -58.95625645, "Y": -181.5133574, "Z": -594.5119029},
      "Lateral Anterior Cortex": {"X": -90.8286383, "Y": -190.8490313, "Z": -585.1857142},
      "Medial Posterior Proximal": {"X": -35.59287155, "Y": -224.0890352, "Z": -592.6847292},
      "Lateral Posterior Proximal": {"X": -70.76411646, "Y": -238.0132572, "Z": -582.8381475}
    },
    "MA Length": 376.2733679,
    "TEA Length": 72.78232649,
    "AP Length": 56.28253453
  },
  {
    "model_id": "07",
    "Source": "43_Femur_L",
    "landmarks": {
      "HIP CENTRE": {"X": -22.15471556, "Y": 42.7980846, "Z": -309.5480757},
      "FEMUR KNEE CENTRE": {"X": -19.05209587, "Y": 34.73746584, "Z": -189.7079688},
      "MEDIAL EPICONDYLE": {"X": -8.466979017, "Y": 40.00223846, "Z": -195.0029231},
      "LATERAL EPICONDYLE": {"X": -28.85101723, "Y": 28.84846781, "Z": -195.4673262},
      "MEDIAL DISTAL CONDYLE": {"X": -11.61857025, "Y": 35.05472838, "Z": -187.3440149},
      "LATERAL DISTAL CONDYLE": {"X": -23.8353499, "Y": 31.16654814, "Z": -188.1762559},
      "MEDIAL POSTERIOR CONDYLE": {"X": -10.0477666, "Y": 28.86063481, "Z": -193.7864367},
      "LATERAL POSTERIOR CONDYLE": {"X": -22.28302427, "Y": 24.06004532, "Z": -193.8770137},
      "Medial Anterior Cortex": {"X": -18.82580828, "Y": 44.72396003, "Z": -193.3852241},
      "Lateral Anterior Cortex": {"X": -29.00324128, "Y": 40.65328304, "Z": -192.2967068},
      "Medial Posterior Proximal": {"X": -11.36545324, "Y": 32.65845458, "Z": -199.6775371},
      "Lateral Posterior Proximal": {"X": -22.5962734, "Y": 27.23578552, "Z": -199.1777149}
    },
    "MA Length": 120.1509511,
    "TEA Length": 23.24072468,
    "AP Length": 17.97204008
  },
  {
    "model_id": "08",
    "Source": "44_Femur_R",
    "landmarks": {
      "HIP CENTRE": {"X": -71.69710955, "Y": 620.8271624, "Z": -798.2977916},
      "FEMUR KNEE CENTRE": {"X": -61.65640904, "Y": 404.3228846, "Z": -475.4729451},
      "MEDIAL EPICONDYLE": {"X": -27.40084477, "Y": 427.6458736, "Z": -481.7938237},
      "LATERAL EPICONDYLE": {"X": -93.36768676, "Y": 397.1374082, "Z": -501.1432958},
      "MEDIAL DISTAL CONDYLE": {"X": -37.60002702, "Y": 401.38694, "Z": -468.3342892},
      "LATERAL DISTAL CONDYLE": {"X": -77.13597984, "Y": 391.8364505, "Z": -476.9582208},
      "MEDIAL POSTERIOR CONDYLE": {"X": -32.51659091, "Y": 394.4516597, "Z": -496.4126933},
      "LATERAL POSTERIOR CONDYLE": {"X": -72.11234229, "Y": 381.1439359, "Z": -504.4343834},
      "Medial Anterior Cortex": {"X": -60.92409693, "Y": 438.2615228, "Z": -469.6197888},
      "Lateral Anterior Cortex": {"X": -93.86031437, "Y": 425.0915822, "Z": -473.1558391},
      "Medial Posterior Proximal": {"X": -36.78088955, "Y": 414.6279435, "Z": -506.7780268},
      "Lateral Posterior Proximal": {"X": -73.12607941, "Y": 398.6214345, "Z": -514.1516324}
    },
    "MA Length": 388.8326111,
    "TEA Length": 75.2116532,
    "AP Length": 58.16113168
  },
  {
    "model_id": "09",
    "Source": "45_Femur_R",
    "landmarks": {
      "HIP CENTRE": {"X": -94.43475621, "Y": 1233.89316, "Z": -501.7395559},
      "FEMUR KNEE CENTRE": {"X": -81.2098004, "Y": 774.3308392, "Z": -276.0848927},
      "MEDIAL EPICONDYLE": {"X": -36.0906055, "Y": 805.0974483, "Z": -267.9351831},
      "LATERAL EPICONDYLE": {"X": -122.977827, "Y": 783.040222, "Z": -310.0984679},
      "MEDIAL DISTAL CONDYLE": {"X": -49.5243031, "Y": 766.2806029, "Z": -269.8755439},
      "LATERAL DISTAL CONDYLE": {"X": -101.5984814, "Y": 761.0660655, "Z": -286.0022636},
      "MEDIAL POSTERIOR CONDYLE": {"X": -42.82873263, "Y": 776.8612429, "Z": -306.4711476},
      "LATERAL POSTERIOR CONDYLE": {"X": -94.98167369, "Y": 766.9643162, "Z": -324.3852991},
      "Medial Anterior Cortex": {"X": -80.24524667, "Y": 809.1890016, "Z": -247.0574798},
      "Lateral Anterior Cortex": {"X": -123.626684, "Y": 796.4951442, "Z": -259.7642475},
      "Medial Posterior Proximal": {"X": -48.44538865, "Y": 806.702039, "Z": -305.0071526},
      "Lateral Posterior Proximal": {"X": -96.31690211, "Y": 793.2998758, "Z": -323.9593842}
    },
    "MA Length": 512.1449533,
    "TEA Length": 99.06388387,
    "AP Length": 76.6060489
  },
  {
    "model_id": "10",
    "Source": "46_Femur_R",
    "landmarks": {
      "HIP CENTRE": {"X": -26.78310147, "Y": 374.2163829, "Z": 51.73911799},
      "FEMUR KNEE CENTRE": {"X": -23.0323073, "Y": 229.3402397, "Z": 41.99453926},
      "MEDIAL EPICONDYLE": {"X": -10.23583253, "Y": 235.7413736, "Z": 48.35918606},
      "LATERAL EPICONDYLE": {"X": -34.87834091, "Y": 236.3027961, "Z": 34.87525889},
      "MEDIAL DISTAL CONDYLE": {"X": -14.04582898, "Y": 226.4824275, "Z": 42.37808176},
      "LATERAL DISTAL CONDYLE": {"X": -28.81484049, "Y": 227.4885336, "Z": 37.677614},
      "MEDIAL POSTERIOR CONDYLE": {"X": -12.1468656, "Y": 234.2707485, "Z": 34.88996772},
      "LATERAL POSTERIOR CONDYLE": {"X": -26.93821541, "Y": 234.3802482, "Z": 29.08647748},
      "Medial Anterior Cortex": {"X": -22.75874552, "Y": 233.7857179, "Z": 54.06733192},
      "Lateral Anterior Cortex": {"X": -35.06236639, "Y": 232.4697961, "Z": 49.14624166},
      "Medial Posterior Proximal": {"X": -13.73983279, "Y": 241.3925704, "Z": 39.48119761},
      "Lateral Posterior Proximal": {"X": -27.31690605, "Y": 240.7883295, "Z": 32.92566791}
    },
    "MA Length": 145.2519265,
    "TEA Length": 28.09599093,
    "AP Length": 21.72661491
  }
]

# 54 Morphometric Edges Data
MORPHOMETRIC_EDGES_RAW: List[Dict[str, Any]] = [
  {"edge_id": 1, "V1": 1, "V2": 2, "37_Femur_R": 343.0698867, "38_Femur_R": 463.4758385, "39_Femur_R": 163.2995916, "40_Femur_R": 537.3297328, "41_Femur_R": 330.7020161, "42_Femur_R": 376.2733679, "43_Femur_L": 120.1509511, "44_Femur_R": 388.8326111, "45_Femur_R": 512.1449533, "46_Femur_R": 145.2519265},
  {"edge_id": 2, "V1": 1, "V2": 3, "37_Femur_R": 329.487097, "38_Femur_R": 445.125948, "39_Femur_R": 156.83425, "40_Femur_R": 516.055826, "41_Femur_R": 317.608894, "42_Femur_R": 361.375989, "43_Femur_L": 115.393946, "44_Femur_R": 373.437988, "45_Femur_R": 491.86816, "46_Femur_R": 139.501126},
  {"edge_id": 3, "V1": 1, "V2": 4, "37_Femur_R": 328.72021, "38_Femur_R": 444.08991, "39_Femur_R": 156.469216, "40_Femur_R": 514.854698, "41_Femur_R": 316.869654, "42_Femur_R": 360.534881, "43_Femur_L": 115.125365, "44_Femur_R": 372.568805, "45_Femur_R": 490.723329, "46_Femur_R": 139.176435},
  {"edge_id": 4, "V1": 1, "V2": 5, "37_Femur_R": 350.9238701, "38_Femur_R": 474.0863052, "39_Femur_R": 167.0380494, "40_Femur_R": 549.6309548, "41_Femur_R": 338.2728589, "42_Femur_R": 384.8874868, "43_Femur_L": 122.9015964, "44_Femur_R": 397.7342519, "45_Femur_R": 523.8696139, "46_Femur_R": 148.5772146},
  {"edge_id": 5, "V1": 1, "V2": 6, "37_Femur_R": 348.1767047, "38_Femur_R": 470.3749774, "39_Femur_R": 165.7304121, "40_Femur_R": 545.3282347, "41_Femur_R": 335.6247304, "42_Femur_R": 381.8744414, "43_Femur_L": 121.939476, "44_Femur_R": 394.6206371, "45_Femur_R": 519.7685634, "46_Femur_R": 147.4140957},
  {"edge_id": 6, "V1": 1, "V2": 7, "37_Femur_R": 334.713974, "38_Femur_R": 452.187283, "39_Femur_R": 159.322218, "40_Femur_R": 524.24237, "41_Femur_R": 322.647339, "42_Femur_R": 367.108742, "43_Femur_L": 117.224519, "44_Femur_R": 379.362088, "45_Femur_R": 499.670998, "46_Femur_R": 141.714127},
  {"edge_id": 7, "V1": 1, "V2": 8, "37_Femur_R": 334.58409, "38_Femur_R": 452.011814, "39_Femur_R": 159.260394, "40_Femur_R": 524.03894, "41_Femur_R": 322.522138, "42_Femur_R": 366.966287, "43_Femur_L": 117.17903, "44_Femur_R": 379.214879, "45_Femur_R": 499.477103, "46_Femur_R": 141.659136},
  {"edge_id": 8, "V1": 1, "V2": 9, "37_Femur_R": 331.8643, "38_Femur_R": 448.337469, "39_Femur_R": 157.965787, "40_Femur_R": 519.779096, "41_Femur_R": 319.900397, "42_Femur_R": 363.983266, "43_Femur_L": 116.226497, "44_Femur_R": 376.132291, "45_Femur_R": 495.41692, "46_Femur_R": 140.507607},
  {"edge_id": 9, "V1": 1, "V2": 10, "37_Femur_R": 335.417152, "38_Femur_R": 453.137253, "39_Femur_R": 159.656927, "40_Femur_R": 525.343715, "41_Femur_R": 323.325167, "42_Femur_R": 367.879976, "43_Femur_L": 117.470788, "44_Femur_R": 380.159064, "45_Femur_R": 500.720723, "46_Femur_R": 142.011845},
  {"edge_id": 10, "V1": 1, "V2": 11, "37_Femur_R": 316.551719, "38_Femur_R": 427.650689, "39_Femur_R": 150.677073, "40_Femur_R": 495.795922, "41_Femur_R": 305.139844, "42_Femur_R": 347.188681, "43_Femur_L": 110.86368, "44_Femur_R": 358.777136, "45_Femur_R": 472.557842, "46_Femur_R": 134.024433},
  {"edge_id": 11, "V1": 1, "V2": 12, "37_Femur_R": 318.262924, "38_Femur_R": 429.96247, "39_Femur_R": 151.491599, "40_Femur_R": 498.476079, "41_Femur_R": 306.789359, "42_Femur_R": 349.065503, "43_Femur_L": 111.462983, "44_Femur_R": 360.716602, "45_Femur_R": 475.11238, "46_Femur_R": 134.748938},
  {"edge_id": 12, "V1": 2, "V2": 3, "37_Femur_R": 36.98709, "38_Femur_R": 49.96831, "39_Femur_R": 17.605674, "40_Femur_R": 57.930655, "41_Femur_R": 35.653684, "42_Femur_R": 40.566827, "43_Femur_L": 12.953728, "44_Femur_R": 41.920866, "45_Femur_R": 55.21543, "46_Femur_R": 15.659917},
  {"edge_id": 13, "V1": 2, "V2": 4, "37_Femur_R": 36.551421, "38_Femur_R": 49.379736, "39_Femur_R": 17.398298, "40_Femur_R": 57.248292, "41_Femur_R": 35.23372, "42_Femur_R": 40.088992, "43_Femur_L": 12.801147, "44_Femur_R": 41.427082, "45_Femur_R": 54.56505, "46_Femur_R": 15.47546},
  {"edge_id": 14, "V1": 2, "V2": 5, "37_Femur_R": 22.290963, "38_Femur_R": 30.114339, "39_Femur_R": 10.61039, "40_Femur_R": 34.912995, "41_Femur_R": 21.487361, "42_Femur_R": 24.448359, "43_Femur_L": 7.806807, "44_Femur_R": 25.264396, "45_Femur_R": 33.276614, "46_Femur_R": 9.437743},
  {"edge_id": 15, "V1": 2, "V2": 6, "37_Femur_R": 17.596098, "38_Femur_R": 23.771735, "39_Femur_R": 8.375657, "40_Femur_R": 27.559711, "41_Femur_R": 16.961749, "42_Femur_R": 19.299109, "43_Femur_L": 6.162558, "44_Femur_R": 19.943274, "45_Femur_R": 26.26798, "46_Femur_R": 7.44999},
  {"edge_id": 16, "V1": 2, "V2": 7, "37_Femur_R": 32.8361, "38_Femur_R": 44.360463, "39_Femur_R": 15.629823, "40_Femur_R": 51.429208, "41_Femur_R": 31.652339, "42_Femur_R": 36.01409, "43_Femur_L": 11.499956, "44_Femur_R": 37.216168, "45_Femur_R": 49.018709, "46_Femur_R": 13.902435},
  {"edge_id": 17, "V1": 2, "V2": 8, "37_Femur_R": 34.004396, "38_Femur_R": 45.938791, "39_Femur_R": 16.185926, "40_Femur_R": 53.25904, "41_Femur_R": 32.778517, "42_Femur_R": 37.295458, "43_Femur_L": 11.90912, "44_Femur_R": 38.540305, "45_Femur_R": 50.762776, "46_Femur_R": 14.397078},
  {"edge_id": 18, "V1": 2, "V2": 9, "37_Femur_R": 30.393241, "38_Femur_R": 41.060242, "39_Femur_R": 14.467034, "40_Femur_R": 47.603105, "41_Femur_R": 29.297547, "42_Femur_R": 33.334803, "43_Femur_L": 10.644411, "44_Femur_R": 34.447451, "45_Femur_R": 45.371936, "46_Femur_R": 12.868156},
  {"edge_id": 19, "V1": 2, "V2": 10, "37_Femur_R": 33.871863, "38_Femur_R": 45.759744, "39_Femur_R": 16.122842, "40_Femur_R": 53.051463, "41_Femur_R": 32.650763, "42_Femur_R": 37.150099, "43_Femur_L": 11.862704, "44_Femur_R": 38.390094, "45_Femur_R": 50.564927, "46_Femur_R": 14.340966},
  {"edge_id": 20, "V1": 2, "V2": 11, "37_Femur_R": 36.431858, "38_Femur_R": 49.218211, "39_Femur_R": 17.341387, "40_Femur_R": 57.061029, "41_Femur_R": 35.118469, "42_Femur_R": 39.957859, "43_Femur_L": 12.759273, "44_Femur_R": 41.291571, "45_Femur_R": 54.386564, "46_Femur_R": 15.424839},
  {"edge_id": 21, "V1": 2, "V2": 12, "37_Femur_R": 35.949027, "38_Femur_R": 48.565922, "39_Femur_R": 17.111561, "40_Femur_R": 56.304799, "41_Femur_R": 34.653043, "42_Femur_R": 39.428297, "43_Femur_L": 12.590174, "44_Femur_R": 40.744334, "45_Femur_R": 53.665779, "46_Femur_R": 15.220413},
  {"edge_id": 22, "V1": 3, "V2": 4, "37_Femur_R": 66.3597975, "38_Femur_R": 89.64984685, "39_Femur_R": 31.58693974, "40_Femur_R": 103.9353603, "41_Femur_R": 63.96748791, "42_Femur_R": 72.78232652, "43_Femur_L": 23.24072468, "44_Femur_R": 75.21165318, "45_Femur_R": 99.06388382, "46_Femur_R": 28.09599093},
  {"edge_id": 23, "V1": 3, "V2": 5, "37_Femur_R": 27.545998, "38_Femur_R": 37.213714, "39_Femur_R": 13.111761, "40_Femur_R": 43.14364, "41_Femur_R": 26.552949, "42_Femur_R": 30.211994, "43_Femur_L": 9.647241, "44_Femur_R": 31.22041, "45_Femur_R": 41.121487, "46_Femur_R": 11.662665},
  {"edge_id": 24, "V1": 3, "V2": 6, "37_Femur_R": 54.24060657, "38_Femur_R": 73.27722895, "39_Femur_R": 25.81826399, "40_Femur_R": 84.9538003, "41_Femur_R": 52.28520094, "42_Femur_R": 59.49019869, "43_Femur_L": 18.99630575, "44_Femur_R": 61.4758611, "45_Femur_R": 80.97199438, "46_Femur_R": 22.964862},
  {"edge_id": 25, "V1": 3, "V2": 7, "37_Femur_R": 32.318693, "38_Femur_R": 43.661463, "39_Femur_R": 15.38354, "40_Femur_R": 50.618825, "41_Femur_R": 31.153585, "42_Femur_R": 35.446607, "43_Femur_L": 11.318748, "44_Femur_R": 36.629743, "45_Femur_R": 48.246308, "46_Femur_R": 13.683371},
  {"edge_id": 26, "V1": 3, "V2": 8, "37_Femur_R": 60.32133186, "38_Femur_R": 81.49208362, "39_Femur_R": 28.71265957, "40_Femur_R": 94.47767467, "41_Femur_R": 58.14671249, "42_Femur_R": 66.1594375, "43_Femur_L": 21.12591538, "44_Femur_R": 68.36770556, "45_Femur_R": 90.04948236, "46_Femur_R": 25.53937259},
  {"edge_id": 27, "V1": 3, "V2": 9, "37_Femur_R": 32.832122, "38_Femur_R": 44.355089, "39_Femur_R": 15.62793, "40_Femur_R": 51.422978, "41_Femur_R": 31.648505, "42_Femur_R": 36.009727, "43_Femur_L": 11.498563, "44_Femur_R": 37.211659, "45_Femur_R": 49.01277, "46_Femur_R": 13.900751},
  {"edge_id": 28, "V1": 3, "V2": 10, "37_Femur_R": 59.17382684, "38_Femur_R": 79.94184294, "39_Femur_R": 28.16645276, "40_Femur_R": 92.68040656, "41_Femur_R": 57.04057568, "42_Femur_R": 64.90087289, "43_Femur_L": 20.72403275, "44_Femur_R": 67.06713265, "45_Femur_R": 88.33645263, "46_Femur_R": 25.05353187},
  {"edge_id": 29, "V1": 3, "V2": 11, "37_Femur_R": 26.198174, "38_Femur_R": 35.392848, "39_Femur_R": 12.470203, "40_Femur_R": 41.032624, "41_Femur_R": 25.253714, "42_Femur_R": 28.733723, "43_Femur_L": 9.175202, "44_Femur_R": 29.692796, "45_Femur_R": 39.109414, "46_Femur_R": 11.092012},
  {"edge_id": 30, "V1": 3, "V2": 12, "37_Femur_R": 55.66403794, "38_Femur_R": 75.20023667, "39_Femur_R": 26.49581036, "40_Femur_R": 87.18323525, "41_Femur_R": 53.65731673, "42_Femur_R": 61.05139465, "43_Femur_L": 19.49482411, "44_Femur_R": 63.08916652, "45_Femur_R": 83.09693514, "46_Femur_R": 23.56752679},
  {"edge_id": 31, "V1": 4, "V2": 5, "37_Femur_R": 57.21082311, "38_Femur_R": 77.28989121, "39_Femur_R": 27.23207256, "40_Femur_R": 89.60587185, "41_Femur_R": 55.14833945, "42_Femur_R": 62.74788294, "43_Femur_L": 20.03654376, "44_Femur_R": 64.84228025, "45_Femur_R": 85.40602216, "46_Femur_R": 24.22241821},
  {"edge_id": 32, "V1": 4, "V2": 6, "37_Femur_R": 26.121162, "38_Femur_R": 35.288808, "39_Femur_R": 12.433545, "40_Femur_R": 40.912005, "41_Femur_R": 25.179479, "42_Femur_R": 28.649257, "43_Femur_L": 9.148231, "44_Femur_R": 29.605512, "45_Femur_R": 38.994449, "46_Femur_R": 11.059406},
  {"edge_id": 33, "V1": 4, "V2": 7, "37_Femur_R": 53.90347745, "38_Femur_R": 72.82177881, "39_Femur_R": 25.65779218, "40_Femur_R": 84.42577523, "41_Femur_R": 51.9602255, "42_Femur_R": 59.12044101, "43_Femur_L": 18.8782354, "44_Femur_R": 61.09376164, "45_Femur_R": 80.46871792, "46_Femur_R": 22.82212531},
  {"edge_id": 34, "V1": 4, "V2": 8, "37_Femur_R": 23.648671, "38_Femur_R": 31.948556, "39_Femur_R": 11.256652, "40_Femur_R": 37.03949, "41_Femur_R": 22.796122, "42_Femur_R": 25.93747, "43_Femur_L": 8.282307, "44_Femur_R": 26.80321, "45_Femur_R": 35.30344, "46_Femur_R": 10.012581},
  {"edge_id": 35, "V1": 4, "V2": 9, "37_Femur_R": 53.9400255, "38_Femur_R": 72.87115395, "39_Femur_R": 25.67518887, "40_Femur_R": 84.48301816, "41_Femur_R": 51.99545594, "42_Femur_R": 59.16052625, "43_Femur_L": 18.89103536, "44_Femur_R": 61.13518477, "45_Femur_R": 80.52327786, "46_Femur_R": 22.83759931},
  {"edge_id": 36, "V1": 4, "V2": 10, "37_Femur_R": 34.903887, "38_Femur_R": 47.153973, "39_Femur_R": 16.61408, "40_Femur_R": 54.667859, "41_Femur_R": 33.645581, "42_Femur_R": 38.282005, "43_Femur_L": 12.224143, "44_Femur_R": 39.559781, "45_Femur_R": 52.105563, "46_Femur_R": 14.777913},
  {"edge_id": 37, "V1": 4, "V2": 11, "37_Femur_R": 52.49346856, "38_Femur_R": 70.91690437, "39_Femur_R": 24.98663484, "40_Femur_R": 82.2173631, "41_Femur_R": 50.60104823, "42_Femur_R": 57.57396662, "43_Femur_L": 18.38441794, "44_Femur_R": 59.49566906, "45_Femur_R": 78.36381462, "46_Femur_R": 22.22514341},
  {"edge_id": 38, "V1": 4, "V2": 12, "37_Femur_R": 21.269681, "38_Femur_R": 28.734622, "39_Femur_R": 10.124265, "40_Femur_R": 33.313423, "41_Femur_R": 20.502897, "42_Femur_R": 23.328234, "43_Femur_L": 7.449131, "44_Femur_R": 24.106883, "45_Femur_R": 31.752014, "46_Femur_R": 9.005344},
  {"edge_id": 39, "V1": 5, "V2": 6, "37_Femur_R": 36.683999, "38_Femur_R": 49.558844, "39_Femur_R": 17.461404, "40_Femur_R": 57.455941, "41_Femur_R": 35.361519, "42_Femur_R": 40.234402, "43_Femur_L": 12.847579, "44_Femur_R": 41.577345, "45_Femur_R": 54.762967, "46_Femur_R": 15.531592},
  {"edge_id": 40, "V1": 5, "V2": 7, "37_Femur_R": 25.909452, "38_Femur_R": 35.002795, "39_Femur_R": 12.332773, "40_Femur_R": 40.580417, "41_Femur_R": 24.975401, "42_Femur_R": 28.417058, "43_Femur_L": 9.074085, "44_Femur_R": 29.365562, "45_Femur_R": 38.678402, "46_Femur_R": 10.96977},
  {"edge_id": 41, "V1": 5, "V2": 8, "37_Femur_R": 47.547249, "38_Femur_R": 64.234729, "39_Femur_R": 22.632258, "40_Femur_R": 74.470397, "41_Femur_R": 45.833143, "42_Femur_R": 52.149035, "43_Femur_L": 16.652138, "44_Femur_R": 53.889664, "45_Femur_R": 70.979951, "46_Femur_R": 20.13097},
  {"edge_id": 42, "V1": 5, "V2": 9, "37_Femur_R": 38.513497, "38_Femur_R": 52.030435, "39_Femur_R": 18.332237, "40_Femur_R": 60.321374, "41_Femur_R": 37.125063, "42_Femur_R": 42.240965, "43_Femur_L": 13.488311, "44_Femur_R": 43.650883, "45_Femur_R": 57.494096, "46_Femur_R": 16.306181},
  {"edge_id": 43, "V1": 5, "V2": 10, "37_Femur_R": 54.032791, "38_Femur_R": 72.996477, "39_Femur_R": 25.719345, "40_Femur_R": 84.628311, "41_Femur_R": 52.084877, "42_Femur_R": 59.26227, "43_Femur_L": 18.923524, "44_Femur_R": 61.240324, "45_Femur_R": 80.661761, "46_Femur_R": 22.876875},
  {"edge_id": 44, "V1": 5, "V2": 11, "37_Femur_R": 35.882001, "38_Femur_R": 48.475373, "39_Femur_R": 17.079657, "40_Femur_R": 56.199821, "41_Femur_R": 34.588434, "42_Femur_R": 39.354784, "43_Femur_L": 12.566701, "44_Femur_R": 40.668368, "45_Femur_R": 53.565721, "46_Femur_R": 15.192035},
  {"edge_id": 45, "V1": 5, "V2": 12, "37_Femur_R": 51.21167295, "38_Femur_R": 69.1852418, "39_Femur_R": 24.37650636, "40_Femur_R": 80.20976367, "41_Femur_R": 49.36546213, "42_Femur_R": 56.16811441, "43_Femur_L": 17.93550361, "44_Femur_R": 58.04289239, "45_Femur_R": 76.45031204, "46_Femur_R": 21.68244558},
  {"edge_id": 46, "V1": 6, "V2": 7, "37_Femur_R": 43.009256, "38_Femur_R": 58.104054, "39_Femur_R": 20.472196, "40_Femur_R": 67.362812, "41_Femur_R": 41.458747, "42_Femur_R": 47.17184, "43_Femur_L": 15.062829, "44_Femur_R": 48.74634, "45_Femur_R": 64.2055, "46_Femur_R": 18.209635},
  {"edge_id": 47, "V1": 6, "V2": 8, "37_Femur_R": 26.388313, "38_Femur_R": 35.64972, "39_Femur_R": 12.560708, "40_Femur_R": 41.330427, "41_Femur_R": 25.436999, "42_Femur_R": 28.942264, "43_Femur_L": 9.241793, "44_Femur_R": 29.908298, "45_Femur_R": 39.39326, "46_Femur_R": 11.172514},
  {"edge_id": 48, "V1": 6, "V2": 9, "37_Femur_R": 43.86731796, "38_Femur_R": 59.26326609, "39_Femur_R": 20.88062924, "40_Femur_R": 68.70674208, "41_Femur_R": 42.28587548, "42_Femur_R": 48.11294749, "43_Femur_L": 15.36334189, "44_Femur_R": 49.7188603, "45_Femur_R": 65.4864398, "46_Femur_R": 18.57292841},
  {"edge_id": 49, "V1": 6, "V2": 10, "37_Femur_R": 33.013689, "38_Femur_R": 44.60038, "39_Femur_R": 15.714355, "40_Femur_R": 51.707356, "41_Femur_R": 31.823526, "42_Femur_R": 36.208867, "43_Femur_L": 11.562152, "44_Femur_R": 37.417446, "45_Femur_R": 49.283819, "46_Femur_R": 13.977624},
  {"edge_id": 50, "V1": 6, "V2": 11, "37_Femur_R": 48.62471431, "38_Femur_R": 65.69034801, "39_Femur_R": 23.14512669, "40_Femur_R": 76.15796594, "41_Femur_R": 46.87176488, "42_Femur_R": 53.33078109, "43_Femur_L": 17.02949138, "44_Femur_R": 55.11085461, "45_Femur_R": 72.58842299, "46_Femur_R": 20.58715644},
  {"edge_id": 51, "V1": 6, "V2": 12, "37_Femur_R": 33.544686, "38_Femur_R": 45.317739, "39_Femur_R": 15.967107, "40_Femur_R": 52.539025, "41_Femur_R": 32.335381, "42_Femur_R": 36.791256, "43_Femur_L": 11.748119, "44_Femur_R": 38.019274, "45_Femur_R": 50.076508, "46_Femur_R": 14.202442},
  {"edge_id": 52, "V1": 7, "V2": 8, "37_Femur_R": 37.529363, "38_Femur_R": 50.700903, "39_Femur_R": 17.863794, "40_Femur_R": 58.779985, "41_Femur_R": 36.176408, "42_Femur_R": 41.161584, "43_Femur_L": 13.143645, "44_Femur_R": 42.535474, "45_Femur_R": 56.024952, "46_Femur_R": 15.88951},
  {"edge_id": 53, "V1": 7, "V2": 11, "37_Femur_R": 20.364045, "38_Femur_R": 27.511137, "39_Femur_R": 9.693186, "40_Femur_R": 31.894979, "41_Femur_R": 19.629909, "42_Femur_R": 22.334947, "43_Femur_L": 7.131956, "44_Femur_R": 23.080442, "45_Femur_R": 30.400053, "46_Femur_R": 8.621907},
  {"edge_id": 54, "V1": 7, "V2": 12, "37_Femur_R": 39.271972, "38_Femur_R": 53.055109, "39_Femur_R": 18.693267, "40_Femur_R": 61.509328, "41_Femur_R": 37.856195, "42_Femur_R": 43.072848, "43_Femur_L": 13.753946, "44_Femur_R": 44.510533, "45_Femur_R": 58.626371, "46_Femur_R": 16.627311}
]

class ModelService:
    @staticmethod
    def get_all_models() -> List[Dict[str, Any]]:
        results: List[Dict[str, Any]] = []
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
        json_path = os.path.join(base_dir, "metadata", "modelsMetadata.json")

        metadata_records = []
        if os.path.exists(json_path):
            try:
                with open(json_path, "r", encoding="utf-8") as f:
                    metadata_records = json.load(f)
            except Exception:
                pass

        for raw_item in RAW_LANDMARKS_10_MODELS:
            m_id = raw_item["model_id"]
            src = raw_item["Source"]
            
            # Find matching metadata entry
            meta = next((m for m in metadata_records if m.get("model_id") == m_id or m.get("Source") == src), {})

            # Format 3D landmarks
            landmarks_list = [
                AnatomicalLandmark(
                    id=k.lower().replace(" ", "_"),
                    label=k,
                    x=v["X"],
                    y=v["Y"],
                    z=v["Z"]
                )
                for k, v in raw_item["landmarks"].items()
            ]

            # Format edges for this specific model
            model_edges = [
                MorphometricEdge(
                    edge_id=e["edge_id"],
                    v1=e["V1"],
                    v2=e["V2"],
                    length_mm=e.get(src, 0.0)
                )
                for e in MORPHOMETRIC_EDGES_RAW
            ]

            model_obj = {
                "model_id": m_id,
                "Source": src,
                "case_label": meta.get("case_label", f"Case {m_id} - CT Morphometry"),
                "patient_age": meta.get("patient_age", 60 + int(m_id)),
                "patient_gender": meta.get("patient_gender", "Female" if int(m_id) % 2 != 0 else "Male"),
                "bone_side": meta.get("bone_side", "Right" if "_R" in src else "Left"),
                "anatomical_region": "Proximal & Diaphyseal Femur",
                "ct_slice_thickness_mm": meta.get("ct_slice_thickness_mm", 0.625),
                "hounsfield_mean_cortical": meta.get("hounsfield_mean_cortical", 1000),
                "hounsfield_mean_trabecular": meta.get("hounsfield_mean_trabecular", 150),
                "neck_shaft_angle_deg": meta.get("neck_shaft_angle_deg", 128.0),
                "anteversion_angle_deg": meta.get("anteversion_angle_deg", 14.0),
                "femoral_head_diameter_mm": meta.get("femoral_head_diameter_mm", 45.0),
                "cortical_thickness_calcar_mm": meta.get("cortical_thickness_calcar_mm", 4.5),
                "cortical_thickness_midshaft_mm": meta.get("cortical_thickness_midshaft_mm", 5.5),
                "ma_length": raw_item.get("MA Length"),
                "tea_length": raw_item.get("TEA Length"),
                "ap_length": raw_item.get("AP Length"),
                "landmarks_3d": [l.model_dump() for l in landmarks_list],
                "raw_landmarks": raw_item["landmarks"],
                "morphometric_edges": [e.model_dump() for e in model_edges],
                "presurgical_notes": meta.get("presurgical_notes", "Standard preoperative planning."),
                "glb_download_url": f"/api/download-model/{m_id}"
            }
            results.append(model_obj)

        return results

    @staticmethod
    def get_model_by_id(model_id: str) -> Optional[Dict[str, Any]]:
        models = ModelService.get_all_models()
        target = str(model_id).strip().lower()
        for m in models:
            if m["model_id"].lower() == target or m["model_id"].zfill(2) == target.zfill(2) or m["Source"].lower() == target:
                return m
        return None
