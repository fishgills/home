localStorage.setItem("table", JSON.stringify([]));


var Chart = {
    data: null,
    lastUpdate: moment("01/01/1900"),
    options: {
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
            3: {axis: 'Temps'},
            4: {axis: 'Temps'},
            5: {axis: 'Temps'},
            6: {axis: 'Temps'}
        },
        axes: {
            // Adds labels to each axis; they don't have to match the axis names.
            y: {
                Energy: {label: 'Energy (kWh)'},
                Temps: {label: 'Temps (F°)'}
            }
        }
    },
    start: function() {
        var self = this;
        google.charts.load('current', {'packages':['line']});
        google.charts.setOnLoadCallback(function() {
            self.init.apply(self);
        });
    },
    updateData: function() {
        var self = this;
        var table = DataService.getTable();
        if(table.length == 0) {
            setTimeout(function() {
                self.updateData.apply(self);
            }, 100);
            return;
        }
        var cur = false;
        var update = false;
        for(var i =0; i < table.length; i++) {
            var row = table[i];
            var cur = moment(row[0]);
            if(cur.isAfter(this.lastUpdate)) {
                var update = true;
                this.data.addRow([new Date(row[0]), row[1], row[2], row[3], row[4], row[5], row[6]]);
            }
        }
        var time_filter = this.data.getFilteredRows([{
            column: 0,
            maxValue: new Date(table[0][0])
        }]);
        if(time_filter.length > 0) {
            this.data.removeRows(0, time_filter.length);
        }

        if(update) {
            this.table.draw(this.data, this.options);
            this.lastUpdate = cur;
        }
        setTimeout(function() {
            self.updateData.apply(self);
        }, 100);
    },
    init: function() {
        this.data = new google.visualization.DataTable();
        this.data.addColumn("datetime", "Time");
        this.data.addColumn("number", "Energy");
        this.data.addColumn("number", "Baby Room");
        this.data.addColumn("number", "Living Room");
        this.data.addColumn("number", "Master Bedroom");
        this.data.addColumn("number", "Hallway");
        this.data.addColumn("number", "Outside");
        this.table = new google.charts.Line(document.getElementById('chart_div'));
        this.updateData();
    }
};

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
var DataService = {
    hours: 1,
    getTable: function() {
        return JSON.parse(localStorage.getItem("table"));
    },
    setTable: function(data) {
        var i = data.length;
        var now = moment().subtract(this.hours, "hours");
        while(i--) {
            if(moment(data[i][0]).isBefore(now)) {
                data.splice(i, 1);
            }
        }
        localStorage.setItem("table", JSON.stringify(data));
    },
    poll: function() {
        var self = this;
        var table = this.getTable();

        var start = (table[table.length - 1] == undefined) ? moment().subtract(this.hours, "hours").valueOf() : moment(table[table.length - 1][0]).valueOf();

        $.get("/data", {
            start: start
        }).done(function(data) {
            var start = new Date(data.cutoff);
            var interval = 5;
            var numPoints = Math.floor((Math.floor((new Date() - start) / 1000)) / interval);

            for(var i = 0; i < numPoints; i++) {
                var energy = closestDate(data.readings, start);
                var temp = closestDate(data.temps, start);
                var tableEntry = table[table.length - 1];
                if(!temp) {
                    temp = {};
                    temp.baby_room = tableEntry[2];
                    temp.living_room = tableEntry[3];
                    temp.master_bedroom = tableEntry[4];
                    temp.hallway = tableEntry[5];
                    temp.outside = tableEntry[6];
                }

                if(!energy) {
                    energy = {}
                    energy.kwh = tableEntry[1];
                }

                table.push([new Date(start.getTime()), energy.kwh, temp.baby_room, temp.living_room, temp.master_bedroom, temp.hallway, temp.outside]);
                start.setSeconds(start.getSeconds() + interval);
            }
            self.setTable(table);
            setTimeout(function() {
                self.poll.apply(self);
            }, 5000);
        });
    },
    start: function() {
        this.poll();
    }
};
$(document).ready(function() {
    DataService.start();
    Chart.start();
});