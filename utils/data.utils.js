const isEmpty = (object) => {
    return [Object, Array].includes((object || {}).constructor) && !Object.entries(object || {}).length;
}

const notEmpty = (object) => {
    return !isEmpty(object);
}

const isNil = (object) => {
    return object == null;
}

const notNil = (object) => {
    return !isNil(object);
}

const isNull = (object) => {
    return object === null;
}

const notNull = (object) => {
    return !isNull(object);
}

module.exports = {
    isEmpty,
    notEmpty,
    isNil,
    notNil,
    isNull,
    notNull
}
