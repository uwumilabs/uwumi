import {AnimationObject} from 'lottie-react-native';

export interface OnboardingData {
  id: number;
  animation: AnimationObject;
  text: string;
  textColor: string;
  backgroundColor: string;
  animated: boolean;
}

const data: OnboardingData[] = [
  {
    id: 1,
    animation: require('./pochita.json'),
    text: 'Enjoy the best anime, movies and more',
    textColor: '#005b4f',
    backgroundColor: '#ffa3ce',
    animated: true,
  },
  {
    id: 2,
    animation: require('./earth-lang.json'),
    text: 'Choose the subtitle languages you prefer',
    textColor: '#F15937',
    backgroundColor: '#faeb8a',
    animated: true,
    
  },
  {
    id: 3,
    animation: require('./earth-lang.json'),
    text: 'Lorem Ipsum dolor sit amet',
    textColor: '#1e2169',
    backgroundColor: '#bae4fd',
    animated: false,
  },
];

export default data;