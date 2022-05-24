import React from 'react';
import {withTranslation} from 'react-i18next';
import {Input, Select} from 'antd';

const {Option} = Select;

const style = {width: '100%'};
class RichInput extends React.Component {
    component = <div></div>
    state = {
        showMore: false,
        value: '',
        modal: false,
        modalValue: ''
    }

    constructor(props) {
        super(props);
        const {t, value, route} = props;
        const onChange = (e) => {
            this.props.onChange(e, route);
        }
        this.state.modalValue = value;
        this.state.value = value;
        switch (props.type) {
            case 'number': this.component = <Input
             style={style} type="number"  defaultValue={value} onChange={onChange}></Input>; break;
            case 'string': 
                if(!props.options) {
                    this.component = <Input.TextArea
                        autoSize= {{ minRows: 1, maxRows: 6 }} 
                    style={style} type="string" onChange={onChange} defaultValue={value}></Input.TextArea>; break;
                } else {
                    this.component = <Select style={style} onChange={onChange} defaultValue={value}>
                        {props.options.map(option => <Option key={option} value={option}>{option}</Option>)}
                    </Select>
                }
                break;
            case 'boolean':
                this.component = <Select style={style} onChange={onChange} defaultValue={value}>
                    <Option value={true}>{t('true')}</Option>
                    <Option value={false}>{t('false')}</Option>
                </Select>
                break;
            default: 
        }
    }
    render() {
        return (<div style={{width: '100%', paddingRight: '5px'}}>
            {this.component}
        </div>);
    }
}

export default withTranslation()(RichInput);