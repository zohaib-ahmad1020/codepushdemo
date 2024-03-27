import React, { Component } from 'react';
import {
  AppRegistry,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,

} from 'react-native';

import CodePush, { LocalPackage } from 'react-native-code-push';
import Config from 'react-native-config';

import {API_HOST} from "@dev"
const imgSource = require('./assets/image.png')
interface AppState {
  syncMessage: string | null;
  progress: { receivedBytes: number; totalBytes: number } | null;
  restartAllowed: boolean;
}

class App extends Component<{}, AppState> {
  constructor(props: {}) {
    super(props);
    this.state = { syncMessage: null, progress: null, restartAllowed: true };
  }

  codePushStatusDidChange(syncStatus: CodePush.SyncStatus) {
    switch (syncStatus) {
      case CodePush.SyncStatus.CHECKING_FOR_UPDATE:
        this.setState({ syncMessage: 'Checking for update.' });
        break;
      case CodePush.SyncStatus.DOWNLOADING_PACKAGE:
        this.setState({ syncMessage: 'Downloading package.' });
        break;
      case CodePush.SyncStatus.AWAITING_USER_ACTION:
        this.setState({ syncMessage: 'Awaiting user action.' });
        break;
      case CodePush.SyncStatus.INSTALLING_UPDATE:
        this.setState({ syncMessage: 'Installing update.' });
        break;
      case CodePush.SyncStatus.UP_TO_DATE:
        this.setState({ syncMessage: 'App up to date.', progress: null });
        break;
      case CodePush.SyncStatus.UPDATE_IGNORED:
        this.setState({ syncMessage: 'Update cancelled by user.', progress: null });
        break;
      case CodePush.SyncStatus.UPDATE_INSTALLED:
        this.setState({
          syncMessage: 'Update installed and will be applied on restart.',
          progress: null,
        });
        break;
      case CodePush.SyncStatus.UNKNOWN_ERROR:
        this.setState({ syncMessage: 'An unknown error occurred.', progress: null });
        break;
    }
  }

  codePushDownloadDidProgress(progress: { receivedBytes: number; totalBytes: number }) {
    this.setState({ progress });
  }

  toggleAllowRestart() {
    this.state.restartAllowed ? CodePush.disallowRestart() : CodePush.allowRestart();

    this.setState((prevState) => ({ restartAllowed: !prevState.restartAllowed }));
  }

  getUpdateMetadata() {
    CodePush.getUpdateMetadata(CodePush.UpdateState.RUNNING).then(
      (metadata: LocalPackage | null) => {
        this.setState({
          syncMessage: metadata ? JSON.stringify(metadata) : 'Running binary version',
          progress: null,
        });
      },
      (error: any) => {
        this.setState({ syncMessage: 'Error: ' + error, progress: null });
      }
    );
  }

  /** Update is downloaded silently, and applied on restart (recommended) */
  sync() {
    CodePush.sync({}, this.codePushStatusDidChange.bind(this), this.codePushDownloadDidProgress.bind(this));
  }

  /** Update pops a confirmation dialog, and then immediately reboots the app */
  syncImmediate() {
    CodePush.sync(
      { installMode: CodePush.InstallMode.IMMEDIATE, updateDialog:{} },
      this.codePushStatusDidChange.bind(this),
      this.codePushDownloadDidProgress.bind(this)
    );
  }

  render() {
    let progressView;

    if (this.state.progress) {
      progressView = (
        <Text style={styles.messages}>
          {this.state.progress.receivedBytes} of {this.state.progress.totalBytes} bytes received
        </Text>
      );
    }

    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>Welcome to CodePush OTA!</Text>
        <Image 
        source={imgSource}
        style={styles.image}
        />
        <Text style={styles.welcome}>Update - 23</Text>
        <Text style={styles.welcome}>API_HOST: {API_HOST}</Text>
        {/* <Text style={styles.welcome}>{JSON.stringify(Config, null, 3)}</Text>
        <Text style={styles.welcome}>{JSON.stringify(Config.API_HOST, null, 3)}</Text> */}
        <TouchableOpacity onPress={this.sync.bind(this)}>
          <Text style={styles.syncButton}>Press for background sync</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={this.syncImmediate.bind(this)}>
          <Text style={styles.syncButton}>Press for dialog-driven sync</Text>
        </TouchableOpacity>
        {progressView}
        {/* <Image style={styles.image} resizeMode={"contain"} source={require("./images/laptop_phone_howitworks.png")}/> */}
        <TouchableOpacity onPress={this.toggleAllowRestart.bind(this)}>
          <Text style={styles.restartToggleButton}>
            Restart {this.state.restartAllowed ? 'allowed' : 'forbidden'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={this.getUpdateMetadata.bind(this)}>
          <Text style={styles.syncButton}>Press for Update Metadata</Text>
        </TouchableOpacity>
        <Text style={styles.messages}>{this.state.syncMessage || ''}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'black',
    paddingTop: 50,
  },
  image: {
    margin: 30,
    width: 100,
    height:100,
  },
  messages: {
    color: 'white',
    marginTop: 30,
    textAlign: 'center',
  },
  restartToggleButton: {
    color: 'green',
    fontSize: 17,
  },
  syncButton: {
    color: 'white',
    fontSize: 17,
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 20,
    color: 'white',
  },
});

let codePushOptions = {
  updateDialog: true,
  checkFrequency: CodePush.CheckFrequency.ON_APP_START,
  installMode: CodePush.InstallMode.IMMEDIATE,
};

export default CodePush(codePushOptions)(App);
