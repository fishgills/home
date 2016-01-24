google.charts.load('current', {'packages':['line']});
google.charts.setOnLoadCallback(drawChart);

function closestDate(array, date) {
    var bestDiff = -(new Date(0,0,0)).valueOf();
    var currDiff = 0;
    var bestDate = 0;
    for(var i = 0; i < array.length; ++i) {
        currDiff = Math.abs(new Date(array[i].date) - date);
        if(currDiff < bestDiff){
            bestDate = i;
            bestDiff = currDiff;
        }
    }
    return array[bestDate];

}
function drawChart() {
    $.get("/data").done(function(jsonData) {

        // Create the data table.
        var data = new google.visualization.DataTable();
        data.addColumn("datetime", "Time");
        data.addColumn("number", "Energy");
        data.addColumn("number", "Baby Room");
        data.addColumn("number", "Living Room");
        data.addColumn("number", "Master Bedroom");

        var start = new Date(jsonData.cutoff);
        var interval = 5;
        var numPoints = ((new Date() - start) / 1000) / interval;

        for(var i = 0; i < numPoints; i++) {
            var energy = closestDate(jsonData.readings, start);
            var temp = closestDate(jsonData.temps, start);
            data.addRow([new Date(start.getTime()), energy.kwh, temp.baby_room, temp.living_room, temp.master_bedroom]);
            start.setSeconds(start.getSeconds() + interval);
        }
        var materialOptions = {
            chart: {
                title: 'Dashboard!'
            },
            width: "100%",
            height: 500,
            series: {
                // Gives each series an axis name that matches the Y-axis below.
                0: {axis: 'Energy'},
                1: {axis: 'Temps'},
                2: {axis: 'Temps'},
                3: {axis: 'Temps'}
            },
            axes: {
                // Adds labels to each axis; they don't have to match the axis names.
                y: {
                    Energy: {label: 'Energy (kWh)'},
                    Temps: {label: 'Temps (F°)'}
                }
            }
        };

        // Instantiate and draw our chart, passing in some options.
        var chart = new google.charts.Line(document.getElementById('chart_div'));
        chart.draw(data, materialOptions);

    });
}