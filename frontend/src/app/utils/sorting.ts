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

const groupItemBy = (array: any[], property: string): any => {
  const hash = {};
  const props = property.split('.');
  for (let i = 0; i < array.length; i++) {
    const key = props.reduce(function (acc, prop) {
      return acc && acc[prop];
    }, array[i]);
    if (!hash[key]) hash[key] = [];
    hash[key].push(array[i]);
  }
  return hash;
};

const sorting = {
  nestedProperty,
  caseInsensitive,
  nestedCaseInsensitive,
  groupItemBy,
};

export default sorting;
