import {Text, SafeAreaView, Button, StyleSheet} from 'react-native';
import React, {useEffect, useState} from 'react';
import * as Paho from 'paho-mqtt';

const client = new Paho.Client(
  'broker.hivemq.com',
  8000,
  `selba-app-${Math.random().toString(16).slice(3)}`,
);

const Home = () => {
  const [value, setValue] = useState(0);

  const onMessage = (message: Paho.Message) => {
    if (message.destinationName === 'test/selba/value') {
      setValue(parseInt(message.payloadString));
    }
  };

  useEffect(() => {
    client.connect({
      useSSL: false,
      onSuccess: () => {
        console.log('Connected to HiveMQ');
        client.subscribe('test/selba/value');
        client.onMessageArrived = onMessage;
      },
      onFailure: err => {
        console.log('Connection failed:', err);
      },
    });
  }, []);

  const changeValue = () => {
    const message = new Paho.Message((value + 1).toString());
    message.destinationName = 'test/selba/value';
    client.send(message);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text>MQTT HiveMQ</Text>
      <Text>Value is: {value}</Text>
      <Button onPress={changeValue} title="Increase Value" />
    </SafeAreaView>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
});
