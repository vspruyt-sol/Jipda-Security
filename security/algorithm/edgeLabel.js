function EdgeLabel(name, info)
{
  this.name = name;
  //Node to get more info
  //this.node = node || false;
  //store info
  this.info = info || {};
}

EdgeLabel.prototype.equals = function (x)
{
    return  (x instanceof EdgeLabel)
        && this.name === x.name;
        //&& _.isEqual(this.info, x.info);
}

EdgeLabel.prototype.toString = function ()
{
  //return this.name;
  switch (this.name)
  {
    case "xxx": 
      return this.name;
    default:
      return this.name;
  }
}

//TODO: om te comparen switch case van alle verschillende zaken