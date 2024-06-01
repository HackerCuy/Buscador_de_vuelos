const d = document;

origenSelector = d.getElementById("origen");
destinoSelector = d.getElementById("destino");
fechaInput = d.getElementById("fecha-salida");
pasajerosInput = d.getElementById("pasajeros");
escalasInput = d.getElementById("vuelosDirectos-Check");

// origenSelector.onchange = function() {
//     event.preventDefault();
//     var selectedOption = event.target.options[event.target.selectedIndex];
//     console.log("Option selected: " + selectedOption.value);
//     destinoSelector.append(generarOpcionesVuelos("--- Destino ---",selectedOption.value));
// }


//Funcion para generar elementos <Option>, con los aeropuertos/ciudades disponibles, 
//declarados en el archivo diccionarios
function generarOpcionesVuelos(placeholder, exclude) {
    // console.log(aeropuertosCiudades);

    let filtro = exclude == undefined ? _ => true : ([a,c]) => a != exclude;

    options = Object.entries(aeropuertosCiudades).filter(filtro).map(([aeropuerto, ciudad]) => {
        //console.log(aeropuerto);
        option = d.createElement("option");
        option.value = aeropuerto;
        option.innerHTML = ciudad;
        return option;
    });

    if (placeholder != undefined) {
        optionPlaceholder = d.createElement("option");
        optionPlaceholder.value = placeholder;
        optionPlaceholder.innerHTML = placeholder;
        optionPlaceholder.disable = true;
        options.unshift(optionPlaceholder);
    }

    console.log(options.map(o => o.value));

    return options;
}
//En estas variables se guardan los arreglos de los elementos <Options>
fromOptions = generarOpcionesVuelos("--- Origen ---");
toOptions = generarOpcionesVuelos("--- Destino ---");

//A estos selectores (dropdown) se agregaron los <Options> como hijos
origenSelector.append(...fromOptions);
destinoSelector.append(...toOptions);



//Validaciones
function validarFiltros() {
    //Origen-Destino distintos
    if (origenSelector.value === destinoSelector.value)
        throw new Error("La ciudad de Origen no puede ser igual a la ciudad de Destino");

    //Fecha a partir de la actual, por efectos del ejercicio y la fecha de evaluacion es necesario deshabilitarla

    // let fechaSeleccionada=new Date(fechaInput.value + "T00:00:00");

    // if(fechaSeleccionada.getDate() < new Date().getDate())
    //     throw new Error ("La fecha es invalida");

    //Numero de pasajeros no puede ser menor a 1
    if(pasajerosInput.value < 1)
        throw new Error ("No ha seleccionado numero de pasajeros");
}

//Llamada de Apis para buscar vuelos segun criterios
async function buscarVuelos() {
   try{validarFiltros();} 
   catch(e)
   {alert(e);
    //Detiene la ejecucion del codigo cuando hay un error de validacion
    throw e;
   }

   //Preparacion de filtro Fecha
    const fechaSalida = new Date(fechaInput.value + "T00:00:00");

    //console.log("Buscando Vuelos...");

    //Busqueda en las Apis por aerolinea
    const responseGermany= await fetch("http://localhost:3000/Germany_AirLines");
    const germanyFlights = await responseGermany.json();
    //console.log(germanyFlights);

    const responseSky= await fetch("http://localhost:3000/Sky_Airways");
    const skyFlights = await responseSky.json();
    //console.log(skyFlights);

    const responseOceanic= await fetch("http://localhost:3000/Oceanic_Airways");
    const oceanicFlights = await responseOceanic.json();
    //console.log(oceanicFlights);

    //Combinacion de las 3 posibles respuestas en una sola
    const allFlights = germanyFlights.concat(skyFlights).concat(oceanicFlights);
    //console.log (allFlights);

    //console.log (origenSelector.value);

    //Filtrado de datos en base a criterios de busqueda
    const results = allFlights.filter(vuelo => {
        let fechaSalidaVuelo = new Date(vuelo["fechaSalida"]);
        // Establecer la hora a 00:00:00 para poder comparar solo en base a la fecha.
        fechaSalidaVuelo.setHours(0,0,0,0);

        //console.log("Filter Flight Date:" + flightDateFilter);
        //console.log("Flight Date:" + flightDate);

        //console.log(flightDate.toDateString() == flightDateFilter.toDateString());

        let incluyeEscalas = escalasInput.checked ? vuelo["numeroEscalas"] == 0 : true


        
        return vuelo["aeropuertoSalida"]==origenSelector.value 
                && vuelo["aeropuertoLlegada"]==destinoSelector.value 
                && fechaSalidaVuelo.toDateString() == fechaSalida.toDateString() 
                && vuelo["numeroAsientosDisponibles"]>= pasajerosInput.value 
                && incluyeEscalas;
    }).sort((vuelo1, vuelo2) => vuelo1.precio - vuelo2.precio);

    console.log(results);
    mostrarResultados(results, pasajerosInput.value);

};


//Funcion para mostrar resultados en la pagina
function mostrarResultados(resultados, pasajeros) {
    //Si no hay resultados, escondemos el div de resultados y mostramos 
    //el mensaje de no resultados
    if (resultados.length == 0){
        noResultados = d.getElementById("no-resultados");
        noResultados.style.visibility = "visible";

        resultadosDiv = d.getElementById("resultados");
        resultadosDiv.style.visibility="hidden";

        //hace lo opueto al If, muestra resultados y oculta mensaje
    }else{
        noResultados = d.getElementById("no-resultados");
        noResultados.style.visibility = "hidden";

        resultadosDiv = d.getElementById("resultados");
        resultadosDiv.style.visibility="visible";

    }
    
    //Jala los resultados y agraga mas infomacion (Separa fecha y Hora), usando MAP
    const detalleVuelos = resultados.map(function(vuelo){
        vuelo["pasajeros"]= pasajeros;
        //Calcula el precio total en base al numero de pasajeros
        vuelo["precioTotal"]= vuelo["precio"]*pasajeros;
        let fechaSalidaVuelo = new Date(vuelo["fechaSalida"]);
        let fechaLlegadaVuelo = new Date(vuelo["fechaLlegada"]);
        //Separacion de fechas y horas en diferentes campos
        vuelo["fechaSalida"]= fechaSalidaVuelo.toLocaleDateString();
        vuelo["fechaLlegada"]= fechaLlegadaVuelo.toLocaleDateString();
        vuelo["horaSalida"]= fechaSalidaVuelo.toLocaleTimeString();
        vuelo["horaLlegada"]= fechaLlegadaVuelo.toLocaleTimeString();
        return vuelo;
    }
    );

//Generacion de codigo HTML para mostrar los vuelos
    resultadosDiv = d.getElementById("resultados-vuelos");
    resultadosDiv.innerHTML="";
        for (vuelo of detalleVuelos){

        let resultadoDiv = d.createElement("div");
        resultadoDiv.className="resultado";

        let aerolineaDiv = d.createElement("div");
        aerolineaDiv.className="aerolinea";
        let nombreAerolineaDiv = d.createElement("div");
        nombreAerolineaDiv.innerHTML=vuelo["aerolinea"];
        let numeroVueloDiv = d.createElement("div");
        numeroVueloDiv.innerHTML = vuelo["numeroVuelo"];
        aerolineaDiv.append(...[nombreAerolineaDiv, numeroVueloDiv]);
        resultadoDiv.append(aerolineaDiv);

        let origenDiv = d.createElement("div");
        origenDiv.className="origen";
        let horaOrigenDiv = d.createElement("div");
        horaOrigenDiv.className="hora";
        horaOrigenDiv.innerHTML=vuelo["horaSalida"];
        let aeropuertoOrigenDiv = d.createElement("div");
        aeropuertoOrigenDiv.className="origen";
        aeropuertoOrigenDiv.innerHTML=vuelo["aeropuertoSalida"];
        origenDiv.append(...[horaOrigenDiv, aeropuertoOrigenDiv]);
        resultadoDiv.append(origenDiv);
        resultadoDiv.append(d.createElement("hr"));


        let avionDiv = d.createElement("div");
        avionDiv.className="avion-icon";
        let iconoDiv = d.createElement("div");
        iconoDiv.className="icono";
        iconoDiv.innerHTML="✈️";
        let escalasSpan = d.createElement("span");
        escalasSpan.innerHTML="Escalas:";
        let escalaDiv = d.createElement("div");
        escalaDiv.className="escala";
        escalaDiv.innerHTML=vuelo["numeroEscalas"];
        avionDiv.append(...[iconoDiv, escalasSpan, escalaDiv]);
        resultadoDiv.append(avionDiv);
        resultadoDiv.append(d.createElement("hr"));

        let destinoDiv = d.createElement("div");
        destinoDiv.className="destino";
        let horaDestinoDiv = d.createElement("div");
        horaDestinoDiv.className="hora";
        horaDestinoDiv.innerHTML=vuelo["horaLlegada"];
        let aeropuertoDestinoDiv = d.createElement("div");
        aeropuertoDestinoDiv.className="destino";
        aeropuertoDestinoDiv.innerHTML=vuelo["aeropuertoLlegada"];
        destinoDiv.append(...[horaDestinoDiv, aeropuertoDestinoDiv]);
        resultadoDiv.append(destinoDiv);

        let precioUnitarioDiv = d.createElement("div");
        precioUnitarioDiv.className="precio";
        let tituloPrecioUnitDiv = d.createElement("div");
        tituloPrecioUnitDiv.className="precioxvuelo";
        tituloPrecioUnitDiv.innerHTML="Precio Unitario";
        let valorPrecioUniDiv = d.createElement("div");
        valorPrecioUniDiv.className="precioTotal";
        valorPrecioUniDiv.innerHTML="$" + vuelo["precio"];
        precioUnitarioDiv.append(...[tituloPrecioUnitDiv, valorPrecioUniDiv]);


        let precioTotalDiv = d.createElement("div");
        precioTotalDiv.className="precio";
        let tituloPrecioTotalDiv = d.createElement("div");
        tituloPrecioTotalDiv.className="precioxvuelo";
        tituloPrecioTotalDiv.innerHTML="Precio Total";
        let valorPrecioTotalDiv = d.createElement("div");
        valorPrecioTotalDiv.className="precioTotal";
        valorPrecioTotalDiv.innerHTML="$" + vuelo["precioTotal"];
        precioTotalDiv.append(...[tituloPrecioTotalDiv, valorPrecioTotalDiv]);
        resultadoDiv.append(...[precioUnitarioDiv, precioTotalDiv]);

























        resultadosDiv.append(resultadoDiv);


    }






    console.log(detalleVuelos);


}