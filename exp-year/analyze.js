fs = require('fs');
fs.readFile('Expenditures.csv', 'utf8', function(err, data) {
  if (err) {
    return console.log(err);
  }
  // console.log(data);
  fileData = data.split('\n');
  var cols;
  var totals = new Array();


  for(i in fileData) {
    if (fileData[i]) {
      var row = fileData[i].replace("BUSINESS, ECONOMIC DEVELOPMENT, AND TOURISM", "BUSINESS ECONOMIC DEVELOPMENT AND TOURISM")

      console.log(row);
      cols = row.split(',');
      for(j in cols) {
        console.log('' + j + ' - ' + cols[j]);
      }

      dept = cols[2].replace(/"/g, '').trim();

      if (!totals[cols[0]] )  {
        totals[cols[0]] = new Array();
      }

      if (!totals[cols[0] ][ dept ]) {
        totals[cols[0]][dept] = 0;
      }

      var val = parseInt( cols[12].replace('$', ''))
      var year = cols[0];

      console.log('year: ' + year)
      console.log('dept: ' + dept)
      console.log(totals[year][dept])
      if (val) {
        totals[year][dept] += val;
      }

    }
  }

  // console.log('');
  // console.log("{ ");
  // for(year in totals) {
  //   console.log(year + ": {")
  //   for(dept in totals[year]) {
  //     console.log('\t"' + dept + '": ' + totals[year][dept] + ',');
  //   }
  //   console.log("}")
  // }
  // console.log("}")
  console.log('');
  for(year in totals) {
    for(dept in totals[year]) {
      // console.log('\t"' + dept + '": ' + totals[year][dept] + ',');
      console.log(year + ',' +  dept + ',' + totals[year][dept]);
    }
  }

});
