import React from 'react';
import _ from 'lodash';
import Shortid from 'shortid';
import {Input} from 'react-bootstrap';
import Moment from 'moment';

import 'components/dropdown_datepicker.scss';

class Page extends React.Component {
    constructor(props) {
        super(props);
        var month = 0; //eslint-disable-line vars-on-top
        var day = 0; //eslint-disable-line vars-on-top
        var year = 0; //eslint-disable-line vars-on-top
        var date = Moment(); //eslint-disable-line vars-on-top
        if (this.props.value != null) {
            date = Moment(this.props.value);
            month = date.month() + 1;
            day = date.date();
            year = date.year();
        }
        this.state = {
            date,
            month,
            day,
            year
        };
        this.setState = this.setState.bind(this);
    }
    componentWillReceiveProps(nextProps) {
        var month = 0;
        var day = 0;
        var year = 0;
        if (nextProps.value != null) {
            month = Moment(nextProps.value).month() + 1;
            day = Moment(nextProps.value).date();
            year = Moment(nextProps.value).year();
            this.setState({
                month: month,
                day: day,
                year: year
            });
        }
    }

    getDate(nextState) {
        var month = nextState.month || this.state.month;
        var day = nextState.day || this.state.day;
        var year = nextState.year || this.state.year;
        var momentDate;
        if (!month || !day || !year) {
            return null;
        }
        momentDate = Moment(`${month}-${day}-${year}`, 'MM-DD-YYYY');
        this.setState({date: momentDate});
        return momentDate.format('MM-DD-YYYY');
    }

    reset() {
        this.setState({
            month: 0,
            day: 0,
            year: 0
        });
    }

    renderMonthOptions() {
        var items = [
            <option value={0} key={Shortid.generate()} disabled>Select Month</option>
        ];

        _.each(Moment.monthsShort(), (month, i) => {
            items.push(
                <option value={i + 1} key={Shortid.generate()}>{month}</option>
            );
        });

        return items;
    }

    renderDayOptions() {
        var items = [
            <option value={0} key={Shortid.generate()} disabled>Select Day</option>
        ];

        _.each(Array((new Date(0, this.state.month, 0).getDate())), (day, i) => {
            items.push(
                <option value={i + 1} key={Shortid.generate()}>{i + 1}</option>
            );
        });

        return items;
    }

    renderYearOptions() {
        var items = [
            <option value={0} key={Shortid.generate()} disabled>Select Year</option>
        ];
        var currentYear = new Date().getFullYear();

        items = items.concat(_.map(Array(150), (year, i) => {
            if (this.props.future) {
                return <option value={currentYear + i} key={Shortid.generate()}>{currentYear + i}</option>;
            }
            return <option value={currentYear - i} key={Shortid.generate()}>{currentYear - i}</option>;
        }));

        return items;
    }

    render() {
        return (
            <span className={'form-inline dropdown-datepicker ' + this.props.className} >
                <label>{this.props.label}</label>
                <br />
                <Input
                    className="birthday-input"
                    id="month-input"
                    type="select"
                    value={this.state.month}
                    placeholder="Month"
                    validate="required"
                    ref="monthInput"
                    name="monthInput"
                    onChange={e => {
                        this.setState({month: e.target.value});
                        this.props.onChange(this.getDate({month: e.target.value}));
                    }}
                    disabled={this.props.disabled}
                >{this.renderMonthOptions()}</Input>
                <Input
                    className="birthday-input"
                    id="day-input"
                    type="select"
                    value={this.state.day}
                    placeholder="Day"
                    validate="required"
                    ref="dayInput"
                    name="dayInput"
                    onChange={e => {
                        this.setState({day: e.target.value});
                        this.props.onChange(this.getDate({day: e.target.value}));
                    }}
                    disabled={this.props.disabled}
                >{this.renderDayOptions()}</Input>
                <Input
                    className="birthday-input"
                    id="year-input"
                    type="select"
                    value={this.state.year}
                    placeholder="Year"
                    validate="required"
                    ref="yearInput"
                    name="yearInput"
                    onChange={e => {
                        this.setState({year: e.target.value});
                        this.props.onChange(this.getDate({year: e.target.value}));
                    }}
                    disabled={this.props.disabled}
                >{this.renderYearOptions()}</Input>
                <br />
                <input
                    type="hidden"
                    name={this.props.name}
                    value={this.state.date.utc().format()}
                />
            </span>
        );
    }

}

Page.defaultProps = {onChange: _.identity};

export default Page;

