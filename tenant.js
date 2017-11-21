module.exports = {
  tenant: "",
  setTenant: (tenant) => { 
    this.tenant = tenant;
  },
  getTenant: () => {
    return this.tenant;
  }
};