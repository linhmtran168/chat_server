// moment.js language configuration
// language : french (fr)
// author : John Fischer : https://github.com/jfroffice
(function(){var a={months:"janvier_f\u00e9vrier_mars_avril_mai_juin_juillet_ao\u00fbt_septembre_octobre_novembre_d\u00e9cembre".split("_"),monthsShort:"janv._f\u00e9vr._mars_avr._mai_juin_juil._ao\u00fbt_sept._oct._nov._d\u00e9c.".split("_"),weekdays:"dimanche_lundi_mardi_mercredi_jeudi_vendredi_samedi".split("_"),weekdaysShort:"dim._lun._mar._mer._jeu._ven._sam.".split("_"),weekdaysMin:"Di_Lu_Ma_Me_Je_Ve_Sa".split("_"),longDateFormat:{LT:"HH:mm",L:"DD/MM/YYYY",LL:"D MMMM YYYY",LLL:"D MMMM YYYY LT",LLLL:"dddd D MMMM YYYY LT"},calendar:{sameDay:"[Aujourd'hui \u00e0] LT",nextDay:"[Demain \u00e0] LT",nextWeek:"dddd [\u00e0] LT",lastDay:"[Hier \u00e0] LT",lastWeek:"dddd [dernier \u00e0] LT",sameElse:"L"},relativeTime:{future:"dans %s",past:"il y a %s",s:"quelques secondes",m:"une minute",mm:"%d minutes",h:"une heure",hh:"%d heures",d:"un jour",dd:"%d jours",M:"un mois",MM:"%d mois",y:"une ann\u00e9e",yy:"%d ann\u00e9es"},ordinal:function(a){return a===1?"er":"\u00e8me"}};typeof module!="undefined"&&module.exports&&(module.exports=a),typeof window!="undefined"&&this.moment&&this.moment.lang&&this.moment.lang("fr",a)})();