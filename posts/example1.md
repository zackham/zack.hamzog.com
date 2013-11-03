Example post
2013-11-02
General

Example post. Here is some R code to show off the syntax highlighting:

```r
lapply(strsplit(outer(outer(c("basic", "premium"), c("monthly", "yearly"), paste), c("sum", "count"), paste), ' '), function(row) {
  date.results <- sapply(dates, date2results, row[1], row[2], row[3])
  tbl <- Reduce("merge", sapply(1:(length(date.results[2,])), FUN=function(x) { date.results[2,x] }))
  write.csv(t(tbl), paste("rebills_", row[1], "_", row[2], "_", row[3], ".csv", sep=''), row.names=time(tbl), na="")
})
```
