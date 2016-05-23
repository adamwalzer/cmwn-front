import React from 'react';
import _ from 'lodash';
import {Link} from 'react-router';
import { connect } from 'react-redux';
import {Panel, Button} from 'react-bootstrap';

import FlipBoard from 'components/flipboard';
import Toast from 'components/toast';
import ClassNames from 'classnames';
import History from 'components/history';
import HttpManager from 'components/http_manager';
import Actions from 'components/actions';
import Store from 'components/store';

import Layout from 'layouts/two_col';

import 'routes/friends/suggested.scss';

import DefaultProfile from 'media/profile_tranparent.png';

const PAGE_UNIQUE_IDENTIFIER = 'suggested-friends';

const NO_FRIENDS = <div>You are already friends with everyone in your group. <br /> Great Work! <br /> Let's Take Action!</div>;
const HEADINGS = {
    SUGGESTED: 'Suggested Friends'
};
const FRIEND_PROBLEM = 'There was a problem adding your friend. Please try again in a little while.';
const ADD_FRIEND = 'Add Friend';
const REQUESTED = 'Request Sent';
const ACCEPT = 'Accept';
const PROFILE = 'View Profile';

var Component = React.createClass({
    addFriend: function (item, e) {
        var state = Store.getState();
        var id = item.user_id != null ? item.user_id : item.suggest_id;
        e.stopPropagation();
        e.preventDefault();
        HttpManager.POST({url: state.currentUser._links.friend.href}, {
            'friend_id': id
        }).then(() => {
            Actions.dispatch.START_RELOAD_PAGE(Store.getState());
        }).catch(this.friendErr);
    },
    friendErr: function () {
        Toast.error(FRIEND_PROBLEM);
    },
    renderNoData: function (data) {
        if (data == null) {
            //render nothing before a request has been made
            return null;
        }
        //render a nice message if the list is actually empty
        return (
            <Panel header={HEADINGS.SUGGESTED} className="standard">
                <h2>{NO_FRIENDS}</h2>
                <p><a onClick={History.goBack}>Back</a></p>
            </Panel>
        );
    },
    renderFlipsEarned: function (item) {
        if (item.roles && item.roles.data && !~item.roles.data.indexOf('Student')) {
            return null;
        }
        return (
            <p className="userFlips">{item.flips.data.length} Flips Earned</p>
        );
    },
    renderFlip: function (item){
        return (
            <div className="flip">
                <Link to={`/student/${item.uuid}`}>
                    <div className="item">
                        <span className="overlay">
                            <div className="relwrap"><div className="abswrap">
                                <Button onClick={this.addFriend.bind(this, item)} className={ClassNames('green standard', {hidden: item.relationship === 'Pending' || item.relationship === 'requested'})}>{ADD_FRIEND}</Button>
                                <Button
                                    onClick={this.addFriend.bind(this, item)}
                                    className={ClassNames('blue standard', {hidden: item.relationship !== 'Pending'})}
                                >{ACCEPT}</Button>
                                <Button className={ClassNames('blue standard', {hidden: item.relationship !== 'requested'})}>{REQUESTED}</Button>
                                <Button className="purple standard" onClick={History.push.bind(null, '/profile/' + item.user_id)}>{PROFILE}</Button>
                            </div></div>
                        </span>
                        <img src={item.image}></img>
                    </div>
                    <p className="linkText" >{item.username}</p>
                </Link>
                {''/*this.renderFlipsEarned(item)*/}
            </div>
        );
    },
    render: function () {
        if (this.props.data == null) {
            return this.renderNoData();
        }
        return (
           <Layout className={PAGE_UNIQUE_IDENTIFIER}>
                <form>
                    <FlipBoard renderFlip={this.renderFlip} header={HEADINGS.SUGGESTED} data={this.props.data} transform={data => {
                        //data = _.map(data, item => {
                        data = data.set('image', _.has(data, '_embedded.image[0].url') ? data.images.data[0].url : DefaultProfile);
                        //    return item;
                        //});
                        return data;
                    }} />
                </form>
           </Layout>
        );
    }
});

const mapStateToProps = state => {
    var data = [];
    var loading = true;
    if (state.page && state.page.data != null && state.page.data._embedded && state.page.data._embedded.suggest) {
        loading = state.page.loading;
        data = state.page.data._embedded.suggest;
    }
    return {
        data,
        loading
    };
};

var Page = connect(mapStateToProps)(Component);
Page._IDENTIFIER = PAGE_UNIQUE_IDENTIFIER;
export default Page;

