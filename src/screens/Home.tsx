import {Text, SafeAreaView, Button, StyleSheet} from 'react-native';
import React, {useEffect, useState} from 'react';
import Paho from 'paho-mqtt';
import {SIMON_HOST, SIMON_PORT} from '@env';

//let client = new Paho.Client('broker.hivemq.com', 8000, `mqtt-async-test`);

let client = new Paho.Client(
  SIMON_HOST,
  Number(SIMON_PORT),
  `selba-app-${Math.random().toString(16).slice(3)}`,
);

const Home = () => {
  const [value, setValue] = useState(0);
  const onMessage = (message: Paho.Message) => {
    if (message.destinationName === 'mqtt-async-test/value') {
      setValue(parseInt(message.payloadString));
    }
  };
  const handleIncomingMessage = (messageArrived: Paho.Message) => {
    onMessage(messageArrived);
  };
  useEffect(() => {
    client.connect({
      userName: '7935_r9jmeasfd68s0w4okgkc44ckkogo4g04ggwo8ooogk0w400o8',
      password: '2eq2ptdp7kcg4ksss4k4488ww8sccgs0osgg84w4co4gk00gcs',
      useSSL: true,
      onSuccess: () => {
        console.log('Connected!');
        client.subscribe('simon/things/1c9dc24bf4d0/1');
        client.onMessageArrived = handleIncomingMessage;
        //client.onMessageArrived = onMessage;
      },
      onFailure: value => {
        console.log('onFailure ---> ', value);
      },
    });
  }, []);

  const changeValue = (client: Paho.Client) => {
    const message: Paho.Message = new Paho.Message((value + 1).toString());
    message.destinationName = 'mqtt-async-test/value';
    client.send(message);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text>MQTT</Text>
      <Text>Value is: {value}</Text>
      <Button
        onPress={() => {
          changeValue(client);
        }}
        title="Press Me!"
      />
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
