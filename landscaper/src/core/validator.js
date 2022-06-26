function isPromise(p) {
    if (typeof p === 'object' && typeof p.then === 'function') {
      return true;
    }
  
    return false;
  }

class Op {
    parent = undefined;
    props = {}
    constructor(parent, props) {
        this.props = props;
        this.parent = parent;
        // console.log("construct", props);
        try{
            this.value = this[props.op](...props.params)
        } catch(e){
            console.log(props.op, 'is not supported')
        }
    }

    value(params) {
        return params;
    }

    async resolve() {
        if (isPromise(this.value)) {
            this.value = await this.value;
        }
        // console.log('value', this.props, this.value);
        return this.value;
    }

    async eq(...params) {
        let ret = params.map(p => new Op(this.parent, p));
        for (let i = 0; i < ret.length; i++) await ret[i].resolve();
        const value = ret[0].value;
        let result = ret.every((v)=> v.value === value);
        // console.log('eq ret', result);
        return result;
    }

    async get_gc(params) {
        // eslint-disable-next-line
        let config = this.parent.parent.config;
        // FIXME: need a more secure implementation instead of eval
        // eslint-disable-next-line
        return eval(`config.${params}`);
    }

    async get_plugin(params) {
        // eslint-disable-next-line
        let config = await this.parent.getConfigContent();
        // FIXME: need a more secure implementation instead of eval
        // eslint-disable-next-line
        return eval(`config.${params}`);
    }

    async then(...params) {
        console.log('then params', params);
        let ret = params.map(p => new Op(this.parent, p));
        for (let i = 0; i < ret.length; i++) await ret[i].resolve();
        if (ret[0].value) {
            return ret[1].value;
        } else {
            return true;
        }
    }

    async or(...params) {
        let ret = params.map(p => new Op(this.parent, p));
        for (let i = 0; i < ret.length; i++) await ret[i].resolve();
        let result = ret.some((v)=> v.value === true);
        return result;
    }

    async contains(target, value) {
        target = new Op(this.parent, target);
        value = new Op(this.parent, value);
        await target.resolve();
        await value.resolve();
        // console.log("contains", target.value, value.value);
        return target.value.indexOf(value.value) !== -1;
    }

    async match(op1, regex, index) {
        op1 = new Op(this.parent, op1);
        regex = new Op(this.parent, regex);
        index = new Op(this.parent, index);
        await op1.resolve();
        await regex.resolve();
        await index.resolve();
        let ret = op1.value.match(regex.value);
        return ret[index.value]
    }
}

export default Op;