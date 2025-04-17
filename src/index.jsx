import React, { memo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ApolloClient,
  ApolloProvider,
  InMemoryCache,
  gql,
  useQuery,
  useFragment,
  useMutation,
} from "@apollo/client";
import { createFragmentRegistry } from "@apollo/client/cache";
import { link } from "./link.js";
import { AddUser } from "./AddUser.jsx";

export const NameFragment = gql`
  fragment NameFragment on User {
    name
  }
`;

export const ZodiacFragment = gql`
  fragment ZodiacFragment on User {
    zodiac
  }
`;

export const UserFragment = gql`
  fragment UserFragment on User {
    ...NameFragment
    ...ZodiacFragment
  }

  ${NameFragment}
  ${ZodiacFragment}
`;

export const ALL_USERS = gql`
  query AllUsers {
    users {
      id
      ...UserFragment
    }
  }
`;

export const ALL_USERS_NONREACTIVE = gql`
  query AllUsers {
    users {
      id
      ...UserFragment @nonreactive
    }
  }
`;

const EDIT_USER = gql`
  mutation EditUser($name: String, $id: ID, $zodiac: String) {
    editUser(name: $name, id: $id, zodiac: $zodiac) {
      id
      name
      zodiac
    }
  }
`;

function UserComponent({ user }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [zodiac, setZodiac] = useState(user.zodiac);
  const [editUser] = useMutation(EDIT_USER);

  return (
    <tr>
      <td>
        {isEditing ? (
          <input
            type="text"
            name="name"
            id="name"
            onChange={(e) => {
              setName(e.currentTarget.value);
              const updatedUserValues = {
                name: e.currentTarget.value,
                id: user.id,
                zodiac: user.zodiac,
              };

              editUser({
                variables: updatedUserValues,
              });
            }}
            value={name}
          />
        ) : (
          <>
            {name} {Math.random()}
          </>
        )}
      </td>
      <td>
        {isEditing ? (
          <input
            type="text"
            name="zodiac"
            id="zodiac"
            onChange={(e) => {
              setZodiac(e.currentTarget.value);
              const updatedUserValues = {
                zodiac: e.currentTarget.value,
                id: user.id,
                name: user.name,
              };

              editUser({
                variables: updatedUserValues,
              });
            }}
            value={zodiac}
          />
        ) : (
          <>
            {" "}
            {zodiac} {Math.random()}
          </>
        )}
      </td>
      <td>
        <button
          onClick={() => {
            setIsEditing((prevVal) => !prevVal);
          }}
        >
          {isEditing ? "Done editing" : "Edit"} {name}
        </button>
      </td>
    </tr>
  );
}

function UseFragmentUserComponent({ id }) {
  const { data: user } = useFragment({
    fragment: UserFragment,
    from: {
      __typename: "User",
      id,
    },
    fragmentName: "UserFragment",
  });

  return <UserComponent user={user} />;
}

const MemoizedUserComponent = memo(UserComponent);

function UsersTable({ query, shouldMemoize }) {
  const { data } = useQuery(query);

  return (
    <main>
      <h1>Users</h1>
      <AddUser />
      <table>
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Zodiac</th>
            <th scope="col">Edit</th>
          </tr>
        </thead>
        <tbody>
          {data?.users.map((user) => {
            if (query === ALL_USERS_NONREACTIVE) {
              return <UseFragmentUserComponent key={user.id} id={user.id} />;
            } else if (shouldMemoize) {
              return <MemoizedUserComponent key={user.id} user={user} />;
            }
            return <UserComponent key={user.id} user={user} />;
          })}
        </tbody>
      </table>
    </main>
  );
}

function App() {
  const [query, setQuery] = useState(ALL_USERS);
  const [shouldMemoize, setShouldMemoize] = useState(false);

  return (
    <>
      <div>
        <label style={{ marginRight: "1rem" }}>
          <input
            value="slow"
            type="radio"
            name="queryVersion"
            checked={query === ALL_USERS && !shouldMemoize}
            onChange={() => {
              setShouldMemoize(false);
              setQuery(ALL_USERS);
            }}
          />{" "}
          Slow
        </label>
        <label style={{ marginRight: "1rem" }}>
          <input
            value="memo"
            type="radio"
            name="queryVersion"
            checked={shouldMemoize}
            onChange={() => {
              setShouldMemoize(true);
              setQuery(ALL_USERS);
            }}
          />{" "}
          Fast (memo)
        </label>
        <label style={{ marginRight: "1rem" }}>
          <input
            value="nonreactive"
            type="radio"
            name="queryVersion"
            checked={query === ALL_USERS_NONREACTIVE}
            onChange={() => {
              setShouldMemoize(false);
              setQuery(ALL_USERS_NONREACTIVE);
            }}
          />{" "}
          Fast (@nonreactive)
        </label>
      </div>
      <UsersTable query={query} shouldMemoize={shouldMemoize} />
    </>
  );
}

const client = new ApolloClient({
  link,
  cache: new InMemoryCache({
    fragments: createFragmentRegistry(
      gql`
        ${UserFragment}
      `
    ),
  }),
});

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>
);
