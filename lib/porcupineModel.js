const porcupineModel = {
  publicPath: "models/porcupine_params.pv",  
  customWritePath: "0.1.0_porcupine_params.pv",
};

(function () {
  if (typeof module !== "undefined" && typeof module.exports !== "undefined")
    module.exports = porcupineModel;
})();