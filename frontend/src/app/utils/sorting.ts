// this is needed to allow sorting on nested properties
const nestedProperty = (data: any, sortHeaderId: string): string | number => {
    return sortHeaderId
      .split('.')
      .reduce((accumulator, key) => accumulator && accumulator[key], data) as
      | string
      | number;
  };
  
  // this is needed to have caseInsensitive sorting
  const caseInsensitive = (data: any, sortHeaderId: string): string | number => {
    const value = data[sortHeaderId];
    return typeof value === 'string' ? value.toUpperCase() : value;
  };
  
  const nestedCaseInsensitive = (
    data: any,
    sortHeaderId: string
  ): string | number => {
    const value = sortHeaderId
      .split('.')
      .reduce((accumulator, key) => accumulator && accumulator[key], data) as
      | string
      | number;
    return typeof value === 'string' ? value.toUpperCase() : value;
  };
  
  // ... other sorting data accessors
  
  const sorting = {
    nestedProperty,
    caseInsensitive,
    nestedCaseInsensitive,
  };
  
  export default sorting;