import React from 'react';
import {Button, Input} from 'react-bootstrap';
import { connect } from 'react-redux';

import HttpManager from 'components/http_manager';
import Log from 'components/log';
import Toast from 'components/toast';
import History from 'components/history';
import Layout from 'layouts/two_col';
import Form from 'components/form';

const ERRORS = {
    BAD_UPDATE: 'There was a problem creating a district. Please try again later.',
    INVALID_SUBMISSION: 'Invalid submission. Please update fields highlighted in red and submit again'
};

var mapStateToProps;
var Page;

export class CreateDistrict extends React.Component{
    constructor(){
        super();
        this.state = {
            title: '',
            districtId: 1,
            code: ''
        };
    }
    submitData() {
        var postData = {
            title: this.state.title,
            meta: {
                system_id: this.state.districtId, //eslint-disable-line camelcase
                code: this.state.code,
            },
            description: this.state.title,
            type: 'district'
        };
        if (this.refs.formRef.isValid()) {
            HttpManager.POST({url: this.props.data._links.self.href, asJSON: true}, postData).then(res => {
                if (res.response && res.response.org_id) {
                    History.replace('/district/' + res.response.org_id + '?message=created');
                }
            }).catch(err => {
                Toast.error(ERRORS.BAD_UPDATE + (err.message ? ' Message: ' + err.message : ''));
                Log.log('Server refused profile update', err, postData);
            });
        } else {
            Toast.error(ERRORS.INVALID_SUBMISSION);
        }
    }
    render() {
        return (
           <Layout currentUser={this.props.currentUser}>
                <Form ref="formRef">
                    <Input
                        type="text"
                        value={this.state.title}
                        placeholder="District Name"
                        label="District Name"
                        validate="required"
                        ref="titleInput"
                        name="titleInput"
                        onChange={e => this.setState({title: e.target.value})} //eslint-disable-line camelcase
                    />
                    <Input
                        type="select"
                        value={this.state.districtId}
                        label="District ID"
                        validate="required"
                        ref="districtIdInput"
                        name="districtIdInput"
                        onChange={e => this.setState({districtId: e.target.value})}
                    >
                            <option value="1">NYDOE</option>
                    </Input>
                    <Input
                        type="text"
                        value={this.state.code}
                        placeholder="District Code"
                        label="District Code"
                        validate="required"
                        ref="codeInput"
                        name="codeInput"
                        onChange={e => this.setState({code: e.target.value})} //eslint-disable-line camelcase
                    />
                    <Button onClick={this.submitData.bind(this)}> Create </Button>
                </Form>
           </Layout>
        );
    }
}

mapStateToProps = state => {
    var data = {};
    var loading = true;
    var currentUser;
    if (state.page && state.page.data != null) {
        loading = state.page.loading;
        data = state.page.data;
    }
    if (state.currentUser != null){
        currentUser = state.currentUser;
    }
    return {
        data,
        currentUser,
        loading,
    };
};

Page = connect(mapStateToProps)(CreateDistrict);
export default Page;

