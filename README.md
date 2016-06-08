#Hawaii State Budget and Expenditures

##Purpose

During the Code for Hawaii \#CodeAcross Panel of the [2016 Unconferenz](
http://unconferenz.com/2016-schedule/) in Honolulu, the State of Hawaii CIO,
Todd Nacapuy, mentioned that they have a need for matching budget data with
spending.  It was one of the many things that they need help with given the
constraints that they face.

For the CodeAcross portion of the 2016 Unconferenz, our team is trying to
address this need. We'll be working on a data visualization of budgeted funds
versus their expenditures using the open data from the data.hawaii.gov portal.

##Source of data

We're using:

Item | URL
-----|-----
Hawaii Operating Budget | https://data.hawaii.gov/dataset/Hawaii-Operating-Budget/p8xe-w4xh |
Expenditures | https://data.hawaii.gov/dataset/Expenditures/mkz8-mgjp |


The data.hawaii.gov open data portal is powered bySocrata. Socrata provides
various ways to export the data:

* SODA Api
* OData
* Print
* Download

The data can be downloaded in various formats:

* Export to CSV
* Export to CSV for Excel
* Export to JSON
* Export to PDF
* Export to RSS
* Export to XML

We downloaded CSV files of the data published.


##Observations about the data exported as CSV

Some of the things that we noticed about the data in the CSV files:

* There doesn't appear to be any difference between "Export to CSV" "Export to
  CSV for Excel".
* Budget has Service while Expenditures has Department.
* Budget dept names don't match the names in Expenditures.
* Department data of one of the datasets include white spaces (both beginning and ending)
* Department names are slightly different.  One includes "Department of" or "Dept of" and the other dataset does not at all
