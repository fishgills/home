import ecobee
ECSession = ecobee.Session()
ECSession.start()

EC3 = ecobee.Thermostat(ECSession)


def event_handler(event):
    """ Route the incoming request based on type (LaunchRequest, IntentRequest,
    etc.) The JSON body of the request is provided in the event parameter.
    """
    print("event.session.application.applicationId=" +
          event['session']['application']['applicationId'])

    """
    Uncomment this if statement and populate with your skill's application ID to
    prevent someone else from configuring a skill that sends requests to this
    function.
    """
    # if (event['session']['application']['applicationId'] !=
    #         "amzn1.echo-sdk-ams.app.[unique-value-here]"):
    #     raise ValueError("Invalid Application ID")

    if event['session']['new']:
        on_session_started({'requestId': event['request']['requestId']},
                           event['session'])

    if event['request']['type'] == "LaunchRequest":
        return on_launch(event['request'], event['session'])
    elif event['request']['type'] == "IntentRequest":
        return on_intent(event['request'], event['session'])
    elif event['request']['type'] == "SessionEndedRequest":
        return on_session_ended(event['request'], event['session'])


def on_session_started(session_started_request, session):
    """ Called when the session starts """

    print("on_session_started requestId=" + session_started_request['requestId']
          + ", sessionId=" + session['sessionId'])


def on_launch(launch_request, session):
    """ Called when the user launches the skill without specifying what they
    want
    """

    print("on_launch requestId=" + launch_request['requestId'] +
          ", sessionId=" + session['sessionId'])
    # Dispatch to your skill's launch
    return get_welcome_response()


def on_intent(intent_request, session):
    """ Called when the user specifies an intent for this skill """

    print("on_intent requestId=" + intent_request['requestId'] +
          ", sessionId=" + session['sessionId'])

    intent = intent_request['intent']
    intent_name = intent_request['intent']['name']

    # Dispatch to your skill's intent handlers
    if intent_name == "GetTemp":
        return get_temp_from_ec3(intent)

    # if intent_name == "MyColorIsIntent":
    #     return set_color_in_session(intent, session)
    # elif intent_name == "WhatsMyColorIntent":
    #     return get_color_from_session(intent, session)
    elif intent_name == "AMAZON.HelpIntent":
        return get_welcome_response()
    else:
        raise ValueError("Invalid intent")


def on_session_ended(session_ended_request, session):
    """ Called when the user ends the session.

    Is not called when the skill returns should_end_session=true
    """
    print("on_session_ended requestId=" + session_ended_request['requestId'] +
          ", sessionId=" + session['sessionId'])
    # add cleanup logic here

# --------------- Functions that control the skill's behavior ------------------


def get_welcome_response():
    """ If we wanted to initialize the session to have some attributes we could
    add those here
    """

    session_attributes = {}
    card_title = "Welcome"
    speech_output = "Welcome to the eco controller! Do... temperature stuff"

    # If the user either does not reply to the welcome message or says something
    # that is not understood, they will be prompted again with this text.
    reprompt_text = "You can ask about the temperature in certain rooms."

    should_end_session = False
    return build_response(session_attributes, build_speechlet_response(
            card_title, speech_output, reprompt_text, should_end_session))


# def set_color_in_session(intent, session):
#     """ Sets the color in the session and prepares the speech to reply to the
#     user.
#     """
#
#     card_title = intent['name']
#     session_attributes = {}
#     should_end_session = False
#
#     if 'Color' in intent['slots']:
#         favorite_color = intent['slots']['Color']['value']
#         session_attributes = create_favorite_color_attributes(favorite_color)
#         speech_output = "I now know your favorite color is " + \
#                         favorite_color + \
#                         ". You can ask me your favorite color by saying, " \
#                         "what's my favorite color?"
#         reprompt_text = "You can ask me your favorite color by saying, " \
#                         "what's my favorite color?"
#     else:
#         speech_output = "I'm not sure what your favorite color is. " \
#                         "Please try again."
#         reprompt_text = "I'm not sure what your favorite color is. " \
#                         "You can tell me your favorite color by saying, " \
#                         "my favorite color is red."
#     return build_response(session_attributes, build_speechlet_response(
#             card_title, speech_output, reprompt_text, should_end_session))
#
#
# def create_favorite_color_attributes(favorite_color):
#     return {"favoriteColor": favorite_color}
#
def get_temp_from_ec3(intent):
    card_title = intent['name']
    session_attributes = {}

    if 'Room' in intent['slots']:
        room = intent["slots"]["Room"]["value"]
        print "Getting temp for room: %s" % room
        temp = EC3.GetTemp(room)
        print "Got %s" % temp
        speech_output = "The temperature is %s degrees in %s. Yowza" % (temp, room)
        reprompt_text = "You can ask for the temperature by saying what's the temperature in the living room?"
    else:
        speech_output = "You need to specify a room"
        reprompt_text = "Snot nose pea brain"

    return build_response(session_attributes, build_speechlet_response(card_title, speech_output, reprompt_text, True))
#
#
# def get_color_from_session(intent, session):
#     session_attributes = {}
#     reprompt_text = None
#
#     if "favoriteColor" in session.get('attributes', {}):
#         favorite_color = session['attributes']['favoriteColor']
#         speech_output = "Your favorite color is " + favorite_color + \
#                         ". Goodbye."
#         should_end_session = True
#     else:
#         speech_output = "I'm not sure what your favorite color is. " \
#                         "You can say, my favorite color is red."
#         should_end_session = False
#
#     # Setting reprompt_text to None signifies that we do not want to reprompt
#     # the user. If the user does not respond or says something that is not
#     # understood, the session will end.
#     return build_response(session_attributes, build_speechlet_response(
#             intent['name'], speech_output, reprompt_text, should_end_session))

# --------------- Helpers that build all of the responses ----------------------


def build_speechlet_response(title, output, reprompt_text, should_end_session):
    return {
        'outputSpeech': {
            'type': 'PlainText',
            'text': output
        },
        'card': {
            'type': 'Simple',
            'title': 'SessionSpeechlet - ' + title,
            'content': 'SessionSpeechlet - ' + output
        },
        'reprompt': {
            'outputSpeech': {
                'type': 'PlainText',
                'text': reprompt_text
            }
        },
        'shouldEndSession': should_end_session
    }


def build_response(session_attributes, speechlet_response):
    return {
        'version': '1.0',
        'sessionAttributes': session_attributes,
        'response': speechlet_response
    }
# import json
# def request(data):
#     if data["request"]["type"] == "SessionEndedRequest":
#         return False
#     intent = data["request"]["intent"]
#
#     arguments = {}
#
#     for slot in intent["slots"]:
#         arguments[slot] = intent['slots'][slot]['value']
#
#     return [intent['name'], arguments]
#
# def response(room, temp):
#     speech = {
#         "type": "PlainText",
#         "text": "The temperature in %s is %s degrees." % (room, temp)
#     }
#     response = {}
#     response["response"] = {
#         "outputSpeech": speech,
#         "shouldEndSession": True
#     }
#     response["version"] = "1.0"
#
#     return response
