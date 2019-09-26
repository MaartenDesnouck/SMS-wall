# SMSWall

###### Een kleine handleiding bij het gebruik van de SMSWall

Installeer de [SMS Gateway API](https://play.google.com/store/apps/details?id=networked.solutions.sms.gateway.api) app vanuit de Play Store.   
(Deze app stuurt de smsen door naar de computer.)    
Maak vervolgens een account aan op [https://smsgateway.me](https://smsgateway.me).   
Je voegt natuurlijk ook je gsmtoestel toe.   
Vergeet de waardes van **username** en **password** niet in te vullen in config/default.json

Dit is een node applicatie dus je moet node.js geinstalleerd hebben.   


Vervolgens moet je `npm install` een keer uitvoeren.    
De smswall starten doe je met `node app.js`.   

Er zijn verschillende versies voor veschillende evenementen.   
VTK feestje: `http://localhost:3000/vtk`   
Delta feestje:  `http://localhost:3000/delta`   
Speeddate:  `http://localhost:3000/speeddate`

Have fun.   
-- Maarten Desnouck, 20 Jan 2016  
